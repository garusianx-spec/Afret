import { summarizeClinicalAlerts } from '@afrat/core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requirePermission } from '../auth/middleware.js';
import { userStore } from '../auth/userStore.js';
import { messageStore } from '../store/messageStore.js';

async function authorizedPatient(doctorId: string, patientId: string) {
  const pairs = await messageStore.listPatientsForDoctor(doctorId);
  if (!pairs.some((p) => p.patient.id === patientId)) return null;
  return userStore.findById(patientId);
}

const flagSchema = z.object({
  flag: z.enum(['normal', 'watch', 'urgent']),
  note: z.string().max(280).optional(),
});

/**
 * The clinician-facing surface: who her patients are, and the one clinical
 * annotation this server actually holds an opinion on (a flag she herself
 * set, never an automated read of a device value — see the note on
 * `RiskFlag`).
 */
export async function doctorRoutes(app: FastifyInstance) {
  app.get(
    '/api/doctor/patients',
    { preHandler: requirePermission('consult:respond') },
    async (request) => {
      const pairs = await messageStore.listPatientsForDoctor(request.authUser!.id);

      const patients = await Promise.all(
        pairs.map(async ({ room, patient }) => {
          const record = await userStore.findById(patient.id);
          return {
            id: patient.id,
            displayName: patient.displayName,
            roomId: room.id,
            journeyMode: record?.journeyMode,
            journeyWeek: record?.journeyWeek,
            riskFlag: record?.riskFlag ?? 'normal',
            riskFlagNote: record?.riskFlagNote,
            lastMessage: room.lastMessage,
            unreadCount: room.unreadCount,
          };
        }),
      );

      // Whoever needs a reply soonest floats to the top: an urgent flag
      // first, then whoever has been waiting longest since her last message.
      patients.sort((a, b) => {
        if (a.riskFlag !== b.riskFlag) {
          const order = { urgent: 0, watch: 1, normal: 2 };
          return order[a.riskFlag as keyof typeof order] - order[b.riskFlag as keyof typeof order];
        }
        return (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
      });

      return { patients };
    },
  );

  app.patch<{ Params: { patientId: string } }>(
    '/api/doctor/patients/:patientId/flag',
    { preHandler: requirePermission('consult:respond') },
    async (request, reply) => {
      const parsed = flagSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'مقدار برچسب معتبر نیست.' });
      }

      // Only a patient this doctor actually shares a room with can be
      // flagged — otherwise any clinician could annotate any account.
      const pairs = await messageStore.listPatientsForDoctor(request.authUser!.id);
      if (!pairs.some((p) => p.patient.id === request.params.patientId)) {
        return reply.code(404).send({ message: 'این فرد در فهرست مراجعین شما نیست.' });
      }

      await userStore.update(request.params.patientId, {
        riskFlag: parsed.data.flag,
        riskFlagNote: parsed.data.note,
        riskFlagSetAt: new Date().toISOString(),
      });

      return reply.code(204).send();
    },
  );

  /**
   * The clinical-sync drawer. Returns "not shared" for any patient who
   * hasn't opted in — even one this doctor is otherwise authorized to see —
   * since the sharing flag, not the doctor-patient relationship, is what
   * gates this specific data.
   */
  app.get<{ Params: { patientId: string } }>(
    '/api/doctor/patients/:patientId/vitals',
    { preHandler: requirePermission('consult:respond') },
    async (request, reply) => {
      const patient = await authorizedPatient(request.authUser!.id, request.params.patientId);
      if (!patient) return reply.code(404).send({ message: 'این فرد در فهرست مراجعین شما نیست.' });

      if (!patient.vitalsSharingEnabled || !patient.sharedVitals) {
        return { sharingEnabled: false as const };
      }

      const { readings, updatedAt } = patient.sharedVitals;
      const { overallTier, alerts } = summarizeClinicalAlerts(readings);
      return { sharingEnabled: true as const, readings, updatedAt, overallTier, alerts };
    },
  );
}
