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
  IdCard,
  MapPin,
  Briefcase,
  Cake,
  AlertCircle,
} from 'lucide-react';
import { createPatient } from '@/server/actions/patients';

export function PatientNewForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [documentType, setDocumentType] = useState('DPI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [occupation, setOccupation] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [responsibleName, setResponsibleName] = useState('');
  const [responsiblePhone, setResponsiblePhone] = useState('');
  const [responsibleRelationship, setResponsibleRelationship] = useState('');

  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');

  const [source, setSource] = useState('');

  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }
    startTransition(async () => {
      const res = await createPatient({
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
        source: source || null,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error al crear paciente');
        return;
      }
      toast.success('Paciente creado correctamente');
      router.push('/dental/patients/' + res.id);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900">
          Los campos con <span className="font-bold text-rose-600">*</span> son obligatorios. Puedes completar el resto del expediente despues desde el detalle del paciente.
        </p>
      </div>

      <Section title="Datos personales" icon={<User className="h-4 w-4 text-blue-600" />}>
        <Grid2>
          <Field label="Nombre" required>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus className="form-input" placeholder="Juan Carlos" />
          </Field>
          <Field label="Apellido" required>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="form-input" placeholder="Lopez Perez" />
          </Field>
          <Field label="Fecha de nacimiento" icon={<Cake className="h-3 w-3" />}>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="form-input" />
          </Field>
          <Field label="Genero">
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="form-input">
              <option value="">Sin especificar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </Field>
          <Field label="Tipo de documento" icon={<IdCard className="h-3 w-3" />}>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="form-input">
              <option value="DPI">DPI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Numero de documento">
            <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="form-input" placeholder="Numero de DPI o documento" />
          </Field>
          <FieldFull label="Ocupacion" icon={<Briefcase className="h-3 w-3" />}>
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="form-input" placeholder="Ej: Ingeniero, Estudiante, Ama de casa..." />
          </FieldFull>
        </Grid2>
      </Section>

      <Section title="Contacto" icon={<Phone className="h-4 w-4 text-emerald-600" />}>
        <Grid2>
          <Field label="Telefono principal" icon={<Phone className="h-3 w-3" />}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" placeholder="+502 0000 0000" />
          </Field>
          <Field label="Telefono secundario">
            <input type="tel" value={phoneSecondary} onChange={(e) => setPhoneSecondary(e.target.value)} className="form-input" placeholder="Opcional" />
          </Field>
          <Field label="Email" icon={<Mail className="h-3 w-3" />}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="paciente@ejemplo.com" />
          </Field>
          <Field label="Ciudad" icon={<MapPin className="h-3 w-3" />}>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" placeholder="Ciudad de Guatemala" />
          </Field>
          <FieldFull label="Direccion completa">
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" placeholder="Calle, numero, zona, sector, referencias..." />
          </FieldFull>
        </Grid2>
      </Section>

      <Section title="Informacion clinica" icon={<Heart className="h-4 w-4 text-rose-600" />}>
        <Grid2>
          <Field label="Tipo de sangre">
            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="form-input">
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
          <FieldFull label="Alergias importantes">
            <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} className="form-input" placeholder="Ej: Penicilina, latex, mariscos. Si no tiene alergias conocidas, dejar vacio." />
          </FieldFull>
          <FieldFull label="Notas medicas generales">
            <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} rows={3} className="form-input" placeholder="Condiciones medicas relevantes, medicamentos actuales, observaciones..." />
          </FieldFull>
        </Grid2>
      </Section>

      <Section title="Contacto de emergencia" icon={<UsersIcon className="h-4 w-4 text-amber-600" />}>
        <Grid2>
          <Field label="Nombre del contacto">
            <input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} className="form-input" placeholder="Nombre completo" />
          </Field>
          <Field label="Telefono del contacto" icon={<Phone className="h-3 w-3" />}>
            <input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} className="form-input" placeholder="+502 0000 0000" />
          </Field>
        </Grid2>
      </Section>

      <Section title="Responsable / Tutor (si es menor de edad)" icon={<UsersIcon className="h-4 w-4 text-violet-600" />}>
        <Grid2>
          <Field label="Nombre del responsable">
            <input type="text" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} className="form-input" placeholder="Nombre completo" />
          </Field>
          <Field label="Telefono del responsable">
            <input type="tel" value={responsiblePhone} onChange={(e) => setResponsiblePhone(e.target.value)} className="form-input" />
          </Field>
          <FieldFull label="Parentesco">
            <input type="text" value={responsibleRelationship} onChange={(e) => setResponsibleRelationship(e.target.value)} className="form-input" placeholder="Padre, madre, tutor legal..." />
          </FieldFull>
        </Grid2>
      </Section>

      <Section title="Seguro medico" icon={<Shield className="h-4 w-4 text-blue-600" />}>
        <Grid2>
          <Field label="Aseguradora">
            <input type="text" value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} className="form-input" placeholder="Ej: BAM Seguros, GyT Seguros..." />
          </Field>
          <Field label="Numero de poliza">
            <input type="text" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} className="form-input" />
          </Field>
        </Grid2>
      </Section>

      <Section title="Como nos conocio?" icon={<User className="h-4 w-4 text-slate-600" />}>
        <Field label="Fuente de captacion">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="form-input">
            <option value="">Sin especificar</option>
            <option value="recomendacion">Recomendacion de paciente</option>
            <option value="redes_sociales">Redes sociales (Facebook, Instagram)</option>
            <option value="google">Google / busqueda web</option>
            <option value="publicidad">Publicidad / volante</option>
            <option value="cercania">Pasaba por la clinica</option>
            <option value="convenio">Convenio empresarial</option>
            <option value="seguro">Por su seguro medico</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
      </Section>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
        <Link href="/dental/patients" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <X className="h-4 w-4" />
          Cancelar
        </Link>
        <button type="submit" disabled={isPending || !isFormValid} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="h-4 w-4" />
          {isPending ? 'Creando...' : 'Crear paciente'}
        </button>
      </div>

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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
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

function Field({ label, required, icon, children }: { label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode; }) {
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

function FieldFull({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div className="sm:col-span-2">
      <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
