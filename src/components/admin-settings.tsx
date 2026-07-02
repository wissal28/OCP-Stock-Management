import { useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, LockKeyhole, Mail, Phone, Save, UserRound } from "lucide-react";

export type AdminProfile = {
  fullName: string;
  phone: string;
  photoUrl: string;
  matricule: string;
  email: string;
};

type AdminSettingsProps = {
  profile: AdminProfile;
  currentPassword: string;
  onProfileChange: (profile: AdminProfile) => void;
  onPasswordChange: (password: string) => void;
  onNotify: (message: string) => void;
};

const inputClass =
  "h-12 w-full rounded-md border border-[#dfe6d7] bg-white px-4 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const disabledClass = "h-12 w-full rounded-md border border-[#dfe6d7] bg-[#edf2e8] px-4 text-sm font-bold text-[#829187] outline-none";

export function AdminSettings({ profile, currentPassword, onProfileChange, onPasswordChange, onNotify }: AdminSettingsProps) {
  const [draft, setDraft] = useState(profile);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const updateDraft = (key: keyof AdminProfile, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateDraft("photoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onProfileChange(draft);
    onNotify("Informations administrateur mises à jour.");
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (oldPassword !== currentPassword) {
      setPasswordError("L'ancien mot de passe est incorrect.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    onPasswordChange(newPassword);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onNotify("Mot de passe administrateur modifié.");
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Paramètres</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#102b20]">Informations administrateur</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Modifiez les informations visibles du compte administrateur. Le matricule et l'email sont verrouillés.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[#dfe6d7] bg-[#f8faf7] px-4 py-3">
            {draft.photoUrl ? (
              <img src={draft.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4ed] text-[#0d6b4d]">
                <UserRound size={24} aria-hidden="true" />
              </span>
            )}
            <span>
              <span className="block text-sm font-black text-[#102b20]">{draft.fullName}</span>
              <span className="block text-xs font-semibold text-[#6c7c71]">{draft.matricule}</span>
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
        <form onSubmit={handleProfileSubmit} className="rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] sm:p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Photo de profil
              <div className="flex flex-col gap-4 rounded-lg border border-dashed border-[#b8c6bc] bg-[#f8faf7] p-4 sm:flex-row sm:items-center">
                {draft.photoUrl ? (
                  <img src={draft.photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0d6b4d]">
                    <Camera size={24} aria-hidden="true" />
                  </span>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm font-semibold text-[#5e7166] file:mr-4 file:h-10 file:rounded-md file:border-0 file:bg-[#0d6b4d] file:px-4 file:text-sm file:font-bold file:text-white" />
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Nom complet
                <input className={inputClass} value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Téléphone
                <span className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
                  <input className={`${inputClass} pl-11`} value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="+212 6 00 00 00 00" />
                </span>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Matricule
                <input className={disabledClass} value={draft.matricule} disabled />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#314238]">
                Email
                <span className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98a29a]" size={17} aria-hidden="true" />
                  <input className={`${disabledClass} pl-11`} value={draft.email} disabled />
                </span>
              </label>
            </div>

            <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d] sm:w-auto">
              <Save size={17} aria-hidden="true" />
              Enregistrer les informations
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-black text-[#102b20]">Changer le mot de passe</h2>
            <p className="mt-2 text-sm leading-6 text-[#6c7c71]">Saisissez l'ancien mot de passe, puis le nouveau mot de passe et sa confirmation.</p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Ancien mot de passe
              <span className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
                <input type="password" className={`${inputClass} pl-11`} value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required />
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Nouveau mot de passe
              <input type="password" className={inputClass} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#314238]">
              Confirmer le nouveau mot de passe
              <input type="password" className={inputClass} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </label>

            {passwordError && <p className="rounded-md border border-[#efc3bd] bg-[#fff1ee] px-3 py-2 text-sm font-semibold text-[#a13b2f]">{passwordError}</p>}

            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed]">
              Mettre à jour le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminSettings;
