import { useState } from "react";
import { Detail, Empty, Field, Modal, Section, Segmented } from "../components/ui.jsx";
import { SRD, catBreeds, dogBreeds } from "../lib/catalog.js";
import { formatDate, labelOf } from "../lib/format.js";

const breedLine = (pet) => `${labelOf(pet.species)} · ${pet.breed || "Raça não informada"}`;

export default function Pets({ pets, onEdit, onDelete }) {
  return (
    <Section title="Seus pets" action="Cadastrar pet" onAction={() => onEdit(null)}>
      {pets.length ? (
        <ul className="pet-grid">
          {pets.map((pet) => (
            <li className="pet" key={pet.id}>
              <h3>{pet.name}</h3>
              <p>{breedLine(pet)}</p>
              <div className="actions">
                <button className="button button-quiet" onClick={() => onEdit(pet)}>Editar</button>
                <button className="button button-danger" onClick={() => onDelete(pet.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty illustrated text="Nenhum pet cadastrado ainda." />
      )}
    </Section>
  );
}

export function AdminPets({ pets }) {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const rows = filter === "ALL" ? pets : pets.filter((pet) => pet.species === filter);
  return (
    <Section title="Pets cadastrados">
      <Segmented label="Filtrar por espécie" value={filter} onChange={setFilter} options={[["ALL", "Todos"], ["DOG", "Cachorros"], ["CAT", "Gatos"]]} />
      {rows.length ? (
        <ul className="pet-grid">
          {rows.map((pet) => (
            <li className="pet" key={pet.id}>
              <h3>{pet.name}</h3>
              <p>{breedLine(pet)}</p>
              <p className="muted">Tutor: {pet.ownerName || "não informado"}</p>
              <button className="button button-quiet" onClick={() => setSelected(pet)}>Ver ficha</button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Nenhum pet encontrado." />
      )}
      {selected && <PetDetails pet={selected} onClose={() => setSelected(null)} />}
    </Section>
  );
}

const yesNo = (value) => (value == null ? "Não informado" : value ? "Sim" : "Não");

function PetDetails({ pet, onClose }) {
  return (
    <Modal title={pet.name} onClose={onClose} wide>
      <p className="muted">{breedLine(pet)}</p>
      <dl className="details">
        <Detail label="Tutor" value={pet.ownerName} />
        <Detail label="WhatsApp" value={pet.ownerPhone} />
        <Detail label="E-mail" value={pet.ownerEmail} />
        <Detail label="Endereço" value={pet.ownerAddress} />
        <Detail label="Nascimento" value={pet.birthDate && formatDate(pet.birthDate)} />
        <Detail label="Gênero" value={pet.gender} />
        <Detail label="Castrado" value={yesNo(pet.neutered)} />
        <Detail label="Vacinação em dia" value={yesNo(pet.vaccinationsCurrent)} />
        <Detail label="Antipulgas em dia" value={yesNo(pet.fleaPreventionCurrent)} />
        <Detail label="Doenças ou condições" value={pet.healthConditions} />
        <Detail label="Cuidados especiais" value={pet.specialCare} />
        <Detail label="Alergias" value={pet.allergies} />
        <Detail label="Com pessoas" value={pet.humanSocial} />
        <Detail label="Com outros pets" value={pet.petSocial} />
        <Detail label="Hábitos" value={pet.importantHabits} />
        <Detail label="Observações" value={pet.observations} />
      </dl>
    </Modal>
  );
}

function YesNoSelect({ value, onChange }) {
  return (
    <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "true")}>
      <option value="">Não informado</option>
      <option value="true">Sim</option>
      <option value="false">Não</option>
    </select>
  );
}

export function PetEditor({ item, onClose, onSave, loading }) {
  const [form, setForm] = useState(item ?? { name: "", species: "DOG", breed: SRD, birthDate: "" });
  const set = (key, value) => setForm({ ...form, [key]: value });
  const text = (key) => ({ value: form[key] ?? "", onChange: (e) => set(key, e.target.value) });
  const breeds = { DOG: dogBreeds, CAT: catBreeds }[form.species];

  return (
    <Modal title={item ? `Editar ${item.name}` : "Cadastrar pet"} onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label="Nome"><input required {...text("name")} /></Field>
        <div className="form-row">
          <Field label="Espécie">
            <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value, breed: e.target.value === "OTHER" ? "" : SRD })}>
              {["DOG", "CAT", "OTHER"].map((value) => <option key={value} value={value}>{labelOf(value)}</option>)}
            </select>
          </Field>
          <Field label="Raça">
            {breeds ? (
              <select value={form.breed || SRD} onChange={(e) => set("breed", e.target.value)}>
                {breeds.map((breed) => <option key={breed}>{breed}</option>)}
              </select>
            ) : (
              <input {...text("breed")} />
            )}
          </Field>
        </div>
        <div className="form-row">
          <Field label="Nascimento"><input type="date" value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value || null)} /></Field>
          <Field label="Gênero">
            <select {...text("gender")}>
              <option value="">Não informado</option>
              <option value="MACHO">Macho</option>
              <option value="FÊMEA">Fêmea</option>
            </select>
          </Field>
        </div>
        <div className="form-row form-row-3">
          <Field label="Castrado?"><YesNoSelect value={form.neutered} onChange={(v) => set("neutered", v)} /></Field>
          <Field label="Vacinação em dia?"><YesNoSelect value={form.vaccinationsCurrent} onChange={(v) => set("vaccinationsCurrent", v)} /></Field>
          <Field label="Antipulgas em dia?"><YesNoSelect value={form.fleaPreventionCurrent} onChange={(v) => set("fleaPreventionCurrent", v)} /></Field>
        </div>
        <Field label="Doenças ou condições"><textarea {...text("healthConditions")} /></Field>
        <Field label="Cuidados especiais"><textarea {...text("specialCare")} /></Field>
        <Field label="Alergias"><textarea {...text("allergies")} /></Field>
        <div className="form-row">
          <Field label="Como se dá com pessoas"><input {...text("humanSocial")} /></Field>
          <Field label="Como se dá com outros pets"><input {...text("petSocial")} /></Field>
        </div>
        <Field label="Hábitos importantes"><textarea {...text("importantHabits")} /></Field>
        <Field label="Observações"><textarea {...text("observations")} /></Field>
        <button className="button button-primary button-block" disabled={loading}>{loading ? "Salvando…" : "Salvar pet"}</button>
      </form>
    </Modal>
  );
}
