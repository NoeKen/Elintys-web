'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AudioLines,
  BriefcaseBusiness,
  Cake,
  
  Camera,
  Car,
  
  ChefHat,
  CirclePlus,
  
  FerrisWheel,
  Globe2,
  Heart,
  LampDesk,
  
  
  Mic2,
  Music2,
  PartyPopper,
  
  ShieldCheck,
  Sparkles,
  Theater,
  UsersRound,
  Video,
  Wrench
  
} from 'lucide-react';
import {
  
  
  type EventCreationFormValues,
  
  
  type ProviderCategory
  
} from '@/features/events/lib/event-creation';

export const EVENT_TYPE_ICONS: Record<
  EventCreationFormValues['eventType'],
  LucideIcon
> = {
  conference: UsersRound,
  wedding: Heart,
  gala: Theater,
  concert: Music2,
  festival: FerrisWheel,
  workshop: Wrench,
  corporate: BriefcaseBusiness,
  birthday: Cake,
  networking: Globe2,
  other: CirclePlus
};

export const PROVIDER_ICONS: Record<ProviderCategory, LucideIcon> = {
  photographer: Camera,
  videographer: Video,
  caterer: ChefHat,
  dj: Music2,
  musician: Mic2,
  decorator: Sparkles,
  host: PartyPopper,
  sound: AudioLines,
  lighting: LampDesk,
  security: ShieldCheck,
  transport: Car,
  equipment: Wrench,
  other: CirclePlus
};

export const FEATURED_PROVIDER_IMAGES: Partial<Record<ProviderCategory, string>> = {
  caterer: '/images/event-creation/provider-catering.jpg',
  photographer: '/images/event-creation/provider-photography.jpg',
  dj: '/images/event-creation/provider-dj.jpg',
  decorator: '/images/event-creation/provider-decoration.jpg'
};
