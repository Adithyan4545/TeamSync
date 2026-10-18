'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

const preprocessNumber = (val: unknown): number | undefined => {
  if (val === '' || val === undefined || val === null) return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? undefined : parsed;
};

const hackathonSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  organizer: z.string().optional(),
  theme: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).optional(),
  mode: z.enum(['Online', 'Offline', 'Hybrid']).optional(),
  minTeamSize: z.preprocess(preprocessNumber, z.number().min(1).optional()).optional(),
  maxTeamSize: z.preprocess(preprocessNumber, z.number().min(1).optional()).optional(),
  prize: z.preprocess(preprocessNumber, z.number().optional()).optional(),
  registrationDeadline: z.string().optional(),
  eventDate: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

type FormData = z.infer<typeof hackathonSchema>;

export default function CreateHackathonPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(hackathonSchema) as any });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/hackathons', data);
      toast.success('Hackathon created successfully');
      router.push('/hackathons');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create hackathon');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
            Create a New Hackathon
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            Post a hackathon to find participants, form teams, and manage projects seamlessly.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Hackathon Title *"
                placeholder="e.g. Global AI Hackathon"
                {...register('title')}
                error={errors.title?.message}
                className="md:col-span-2"
              />

              <Input
                label="Organizer"
                placeholder="e.g. Acme Corp"
                {...register('organizer')}
                error={errors.organizer?.message}
              />
              
              <Input
                label="Theme"
                placeholder="e.g. Artificial Intelligence"
                {...register('theme')}
                error={errors.theme?.message}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Difficulty</label>
                <select 
                  {...register('difficulty')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="All Levels">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                {errors.difficulty?.message && <p className="text-sm text-red-500 font-medium">{errors.difficulty.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Mode</label>
                <select 
                  {...register('mode')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                {errors.mode?.message && <p className="text-sm text-red-500 font-medium">{errors.mode.message}</p>}
              </div>

              <Input
                label="Min Team Size"
                type="number"
                placeholder="1"
                {...register('minTeamSize')}
                error={errors.minTeamSize?.message}
              />

              <Input
                label="Max Team Size"
                type="number"
                placeholder="4"
                {...register('maxTeamSize')}
                error={errors.maxTeamSize?.message}
              />

              <Input
                label="Prize Pool ($)"
                type="number"
                placeholder="10000"
                {...register('prize')}
                error={errors.prize?.message}
              />

              <Input
                label="Contact Email"
                type="email"
                placeholder="contact@hackathon.com"
                {...register('contactEmail')}
                error={errors.contactEmail?.message}
              />

              <Input
                label="Registration Deadline"
                type="date"
                {...register('registrationDeadline')}
                error={errors.registrationDeadline?.message}
              />

              <Input
                label="Event Date"
                type="date"
                {...register('eventDate')}
                error={errors.eventDate?.message}
              />

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  {...register('description')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  placeholder="Describe your hackathon in detail..."
                />
                {errors.description?.message && <p className="text-sm text-red-500 font-medium">{errors.description.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-medium" disabled={isSubmitting} isLoading={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Hackathon'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
}
