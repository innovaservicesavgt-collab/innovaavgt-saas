'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type {
  ClinicData,
  ProfessionalData,
  SelectedService,
  ScheduleData,
} from '@/lib/types/onboarding';
import {
  DEFAULT_CLINIC,
  DEFAULT_PROFESSIONAL,
  DEFAULT_SCHEDULE,
} from '@/lib/types/onboarding';
import { ProgressBar } from './progress-bar';
import { Step1Clinic } from './step-1-clinic';
import { Step2Professional } from './step-2-professional';
import { Step3Services } from './step-3-services';
import { Step4Schedule } from './step-4-schedule';
import { Step5Done } from './step-5-done';

type Tenant = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  vertical: string | null;
  onboarding_step: number | null;
};

type Professional = {
  id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  photo_url: string | null;
};

type ServiceTemplate = {
  id: string;
  vertical: string;
  category: string | null;
  name: string;
  default_price: number;
  default_duration_minutes: number;
};

type Props = {
  tenant: Tenant;
  profileEmail: string;
  profileFirstName: string;
  profileLastName: string;
  existingProfessional: Professional | null;
  serviceTemplates: ServiceTemplate[];
  vertical: string;
};

export function OnboardingWizard({
  tenant,
  profileEmail,
  profileFirstName,
  profileLastName,
  existingProfessional,
  serviceTemplates,
  vertical,
}: Props) {
  // Paso actual: lo que dice la BD, mapeado al state
  const [currentStep, setCurrentStep] = useState<number>(tenant.onboarding_step || 1);

  // Datos de cada paso (precargados con lo que ya hay en BD)
  const [clinicData, setClinicData] = useState<ClinicData>({
    name: tenant.name || '',
    address: tenant.address || '',
    phone: tenant.phone || '',
    logo_url: tenant.logo_url,
    primary_color: tenant.primary_color || DEFAULT_CLINIC.primary_color,
    secondary_color: tenant.secondary_color || DEFAULT_CLINIC.secondary_color,
  });

  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    title: existingProfessional?.title || DEFAULT_PROFESSIONAL.title,
    first_name: existingProfessional?.first_name || profileFirstName,
    last_name: existingProfessional?.last_name || profileLastName,
    specialty: existingProfessional?.specialty || DEFAULT_PROFESSIONAL.specialty,
    email: existingProfessional?.email || profileEmail,
    phone: existingProfessional?.phone || null,
    license_number: existingProfessional?.license_number || null,
    photo_url: existingProfessional?.photo_url || null,
  });

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>(DEFAULT_SCHEDULE);

  const goNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900">
              Configura tu {vertical === 'legal' ? 'despacho' : 'clinica'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Tomara solo 3-5 minutos
          </p>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200 px-4 py-5">
        <ProgressBar currentStep={currentStep} />
      </div>

      {/* Steps */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <Step1Clinic
              data={clinicData}
              onChange={setClinicData}
              onNext={goNext}
              vertical={vertical}
            />
          )}
          {currentStep === 2 && (
            <Step2Professional
              data={professionalData}
              onChange={setProfessionalData}
              onNext={goNext}
              onBack={goBack}
              vertical={vertical}
            />
          )}
          {currentStep === 3 && (
            <Step3Services
              templates={serviceTemplates}
              selected={selectedServices}
              onChange={setSelectedServices}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 4 && (
            <Step4Schedule
              data={scheduleData}
              onChange={setScheduleData}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {currentStep === 5 && (
            <Step5Done
              clinicName={clinicData.name}
              professional={professionalData}
              servicesCount={selectedServices.length}
              schedule={scheduleData}
              vertical={vertical}
            />
          )}
        </div>
      </main>
    </div>
  );
}
