import { clinicalSyncPayloadSchema } from '@afrat/core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth, toChatUser } from '../auth/middleware.js';
import { userStore } from '../auth/userStore.js';
import { messageStore } from '../store/messageStore.js';

const journeySchema = z.object({
  journeyMode: z.enum(['cycle', 'ttc', 'pregnancy', 'postpartum']),
  journeyWeek: z.number().int().min(0).max(300).optional(),
});

const sharingSchema = z.object({ enabled: z.boolean() });

/**
 * Self-reported lifecycle stage.
 *
 * This is deliberately the only piece of a mother's health picture that
 * reaches the server: which stage she is in, and roughly how far along —
 * not glucose readings, not blood pressure, not weight. Those stay local to
 * her device (see `apps/web/src/modules/tracker/store`). A doctor's patient
 * list reads this field to show "week 18" next to a name; anything more
 * clinical than that is discussed in the consultation chat itself, by the
 * people actually qualified to interpret it.
 */
export async function profileRoutes(app: FastifyInstance) {
  app.patch(
    '/api/profile/journey',
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = journeySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'اطلاعات ارسالی معتبر نیست.' });
      }

      await userStore.update(request.authUser!.id, parsed.data);
      return reply.code(204).send();
    },
  );

  /**
   * Starts (or resumes) a private consult room with a given doctor. The
   * doctor must already exist and hold `consult:respond`; this is what turns
   * "message a doctor" from a fixed demo room into a real, provisioned 1:1
   * conversation between any mother and any clinician on the platform.
   */
  app.post<{ Body: { doctorId?: string } }>(
    '/api/consult/start',
    { preHandler: requireAuth },
    async (request, reply) => {
      const doctorId = request.body?.doctorId;
      if (!doctorId) return reply.code(400).send({ message: 'شناسهٔ پزشک لازم است.' });

      const doctor = await userStore.findById(doctorId);
      if (!doctor || doctor.role === 'mother') {
        return reply.code(404).send({ message: 'پزشک یافت نشد.' });
      }

      const patient = await userStore.findById(request.authUser!.id);
      if (!patient) return reply.code(404).send({ message: 'حساب کاربری یافت نشد.' });

      const room = await messageStore.createConsultRoom(
        toChatUser({ ...request.authUser!, displayName: patient.fullName || request.authUser!.displayName }),
        toChatUser({
          id: doctor.id,
          mobile: doctor.mobile,
          role: doctor.role,
          roleLabel: '',
          permissions: [],
          displayName: doctor.fullName || 'پزشک',
        }),
      );

      return reply.code(201).send(room);
    },
  );

  /**
   * The consent switch for clinical vitals sync. Turning it on does not by
   * itself send any reading — the device pushes a snapshot separately via
   * PUT /api/profile/vitals, and only while this flag is true (see there).
   * Turning it off immediately deletes whatever was stored: data
   * minimization means an opt-out actually erases the data, not just stops
   * refreshing it.
   */
  app.patch(
    '/api/profile/vitals-sharing',
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = sharingSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'اطلاعات ارسالی معتبر نیست.' });
      }

      await userStore.update(request.authUser!.id, { vitalsSharingEnabled: parsed.data.enabled });
      if (!parsed.data.enabled) {
        await userStore.update(request.authUser!.id, { sharedVitals: undefined });
      }

      return reply.code(204).send();
    },
  );

  /**
   * The actual snapshot: her most recent blood-pressure, glucose, and
   * weight readings, sent only after she has opted in. The server
   * re-checks the flag itself rather than trusting the client to have
   * checked it — a stale UI or a replayed request must not be able to
   * write data for an account that has the switch off.
   */
  app.put(
    '/api/profile/vitals',
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = clinicalSyncPayloadSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'اطلاعات ارسالی معتبر نیست.' });
      }

      const user = await userStore.findById(request.authUser!.id);
      if (!user?.vitalsSharingEnabled) {
        return reply
          .code(403)
          .send({ message: 'اشتراک‌گذاری گزارش سلامت غیرفعال است.' });
      }

      await userStore.update(user.id, {
        sharedVitals: { readings: parsed.data.readings, updatedAt: new Date().toISOString() },
      });

      return reply.code(204).send();
    },
  );
}
