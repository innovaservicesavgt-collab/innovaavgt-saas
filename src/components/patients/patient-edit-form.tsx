'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Mail,
  Heart,
  Shield,
  Users as UsersIcon,
  Save,
  X,
  Trash2,
  AlertTriangle,
  IdCard,
  MapPin,
  Briefcase,
  Cake,
} from 'lucide-react';
import { updatePatient, deactivatePatient } from '@/server/actions/patients';

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  document_type: string | null;
  document_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  occupation: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  responsible_name: string | null;
  responsible_phone: string | null;
  responsible_relationship: string | null;
  is_active: boolean | null;
};

type Props = {
  patient: Patient;
};

export function PatientEditForm({ patient }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado del formulario
  const [firstName, setFirstName] = useState(patient.first_name);
  const [lastName, setLastName] = useState(patient.last_name);
  const [email, setEmail] = useState(patient.email || '');
  const [phone, setPhone] = useState(patient.phone || '');
  const [phoneSecondary, setPhoneSecondary] = useState(patient.phone_secondary || '');
  const [dateOfBirth, setDateOfBirth] = useState(patient.date_of_birth || '');
  const [gender, setGender] = useState(patient.gender || '');
  const [address, setAddress] = useState(patient.address || '');
  const [city, setCity] = useState(patient.city || '');
  const [documentType, setDocumentType] = useState(patient.document_type || 'DPI');
  const [documentNumber, setDocumentNumber] = useState(patient.document_number || '');
  const [emergencyContactName, setEmergencyContactName] = useState(
    patient.emergency_contact_name || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    patient.emergency_contact_phone || ''
  );
  const [bloodType, setBloodType] = useState(patient.blood_type || '');
  const [allergies, setAllergies] = useState(patient.allergies || '');
  const [medicalNotes, setMedicalNotes] = useState(patient.medical_notes || '');
  const [occupation, setOccupation] = useState(patient.occupation || '');
  const [insuranceProvider, setInsuranceProvider] = useState(
    patient.insurance_provider || ''
  );
  const [insuranceNumber, setInsuranceNumber] = useState(patient.insurance_number || '');
  const [responsibleName, setResponsibleName] = useState(patient.responsible_name || '');
  const [responsiblePhone, setResponsiblePhone] = useState(
    patient.responsible_phone || ''
  );
  const [responsibleRelationship, setResponsibleRelationship] = useState(
    patient.responsible_relationship || ''
  );
  const [isActive, setIsActive] = useState(patient.is_active !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    startTransition(async () => {
      const res = await updatePatient({
        id: patient.id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        phone_secondary: phoneSecondary || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        document_type: documentType || null,
        document_number: documentNumber || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        blood_type: bloodType || null,
        allergies: allergies || null,
        medical_notes: medicalNotes || null,
        occupation: occupation || null,
        insurance_provider: insuranceProvider || null,
        insurance_number: insuranceNumber || null,
        responsible_name: responsibleName || null,
        responsible_phone: responsiblePhone || null,
        responsible_relationship: responsibleRelationship || null,
        is_active: isActive,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }

      toast.success('Paciente actualizado');
      router.push(`/dental/patients/${patient.id}`);
      router.refresh();
    });
  };

  const handleDeactivate = () => {
    if (
      !confirm(
        'Desactivar este paciente? El paciente quedara inactivo pero no se borrara su historial.'
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deactivatePatient({ id: patient.id });
      if (!res.ok) {
        toast.error(res.error || 'Error al desactivar');
        return;
      }
      toast.success('Paciente desactivado');
      router.push('/dental/patients');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Datos personales */}
      <Section title="Datos personales" icon={<User className="h-4 w-4 text-blue-600" />}>
        <Grid2>
          <Field label="Nombre *" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="form-input"
            />
          </Field>
          <Field label="Apellido *" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="form-input"
            />
          </Field>
          <Field label="Fecha de nacimiento" icon={<Cake className="h-3 w-3" />}>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Genero">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-input"
            >
              <option value="">Sin especificar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </Field>
          <Field label="Tipo de documento" icon={<IdCard className="h-3 w-3" />}>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="form-input"
            >
              <option value="DPI">DPI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Numero de documento">
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Ocupacion" icon={<Briefcase className="h-3 w-3" />}>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="form-input"
              placeholder="Ej: Ingeniero, Estudiante..."
            />
          </Field>
          <Field label="Estado del paciente">
            <select
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className="form-input"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </Field>
        </Grid2>
      </Section>

      {/* Contacto */}
      <Section title="Contacto" icon={<Phone className="h-4 w-4 text-emerald-600" />}>
        <Grid2>
          <Field label="Telefono principal" icon={<Phone className="h-3 w-3" />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              placeholder="+502 ..."
            />
          </Field>
          <Field label="Telefono secundario">
            <input
              type="tel"
              value={phoneSecondary}
              onChange={(e) => setPhoneSecondary(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Email" icon={<Mail className="h-3 w-3" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="paciente@ejemplo.com"
            />
          </Field>
          <Field label="Ciudad" icon={<MapPin className="h-3 w-3" />}>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
              placeholder="Ciudad de Guatemala"
            />
          </Field>
          <FieldFull label="Direccion">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input"
              placeholder="Calle, numero, zona, sector..."
            />
          </FieldFull>
        </Grid2>
      </Section>

      {/* Informacion clinica */}
      <Section
        title="Informacion clinica"
        icon={<Heart className="h-4 w-4 text-rose-600" />}
      >
        <Grid2>
          <Field label="Tipo de sangre">
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="form-input"
            >
              <option value="">No especificado</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </Field>
          <FieldFull label="Alergias (importantes)">
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={2}
              className="form-input"
              placeholder="Ej: Penicilina, latex, mariscos..."
            />
          </FieldFull>
          <FieldFull label="Notas medicas generales">
            <textarea
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Condiciones medicas relevantes, medicamentos..."
            />
          </FieldFull>
        </Grid2>
      </Section>

      {/* Contacto de emergencia */}
      <Section
        title="Contacto de emergencia"
        icon={<UsersIcon className="h-4 w-4 text-amber-600" />}
      >
        <Grid2>
          <Field label="Nombre del contacto">
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Telefono del contacto" icon={<Phone className="h-3 w-3" />}>
            <input
              type="tel"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      {/* Responsable / Tutor */}
      <Section
        title="Responsable / Tutor (si es menor de edad)"
        icon={<UsersIcon className="h-4 w-4 text-violet-600" />}
      >
        <Grid2>
          <Field label="Nombre del responsable">
            <input
              type="text"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Telefono del responsable">
            <input
              type="tel"
              value={responsiblePhone}
              onChange={(e) => setResponsiblePhone(e.target.value)}
              className="form-input"
            />
          </Field>
          <Field label="Parentesco">
            <input
              type="text"
              value={responsibleRelationship}
              onChange={(e) => setResponsibleRelationship(e.target.value)}
              className="form-input"
              placeholder="Padre, madre, tutor legal..."
            />
          </Field>
        </Grid2>
      </Section>

      {/* Seguro medico */}
      <Section title="Seguro medico" icon={<Shield className="h-4 w-4 text-blue-600" />}>
        <Grid2>
          <Field label="Aseguradora">
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className="form-input"
              placeholder="Ej: BAM Seguros, GyT Seguros..."
            />
          </Field>
          <Field label="Numero de poliza">
            <input
              type="text"
              value={insuranceNumber}
              onChange={(e) => setInsuranceNumber(e.target.value)}
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Desactivar paciente
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/dental/patients/${patient.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Estilos del input compartidos */}
      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background-color: white;
          outline: none;
          transition: all 0.15s;
        }
        :global(.form-input:focus) {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 4px rgb(209 250 229);
        }
      `}</style>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function FieldFull({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}