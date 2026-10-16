"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSessionWithSeed } from "@/lib/repo/sessionRepo";

interface FormState {
  complexName: string;
  buildingNo: string;
  unitNo: string;
  floorPlanType: string;
  inspectorName: string;
  phone: string;
  inspectionDate: string;
  moveInDate: string;
  builderName: string;
}

const INITIAL: FormState = {
  complexName: "",
  buildingNo: "",
  unitNo: "",
  floorPlanType: "",
  inspectorName: "",
  phone: "",
  inspectionDate: new Date().toISOString().slice(0, 10),
  moveInDate: "",
  builderName: "",
};

export default function NewSessionForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!state.complexName.trim() || !state.buildingNo.trim() || !state.unitNo.trim()) {
      setError("단지명·동·호수는 필수입니다.");
      return;
    }
    if (!state.inspectionDate) {
      setError("점검일을 선택하세요.");
      return;
    }

    setSubmitting(true);
    try {
      const sessionId = await createSessionWithSeed(state);
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "세션 생성 중 알 수 없는 오류가 발생했습니다.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <legend className="text-sm font-semibold text-slate-900">세대 정보</legend>
        <Field
          label="단지명"
          required
          value={state.complexName}
          onChange={(v) => update("complexName", v)}
          placeholder="예: 한강 푸르지오"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="동"
            required
            value={state.buildingNo}
            onChange={(v) => update("buildingNo", v)}
            placeholder="101"
            inputMode="numeric"
          />
          <Field
            label="호수"
            required
            value={state.unitNo}
            onChange={(v) => update("unitNo", v)}
            placeholder="2503"
            inputMode="numeric"
          />
        </div>
        <Field
          label="평형 / 타입"
          value={state.floorPlanType}
          onChange={(v) => update("floorPlanType", v)}
          placeholder="예: 84A"
        />
        <Field
          label="시공사 / 시행사"
          value={state.builderName}
          onChange={(v) => update("builderName", v)}
          placeholder="시공자에게 보낼 보고서에 표시됩니다"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <legend className="text-sm font-semibold text-slate-900">점검자</legend>
        <Field
          label="점검자 이름"
          value={state.inspectorName}
          onChange={(v) => update("inspectorName", v)}
          placeholder="입주예정자 또는 동행자"
        />
        <Field
          label="연락처"
          value={state.phone}
          onChange={(v) => update("phone", v)}
          placeholder="010-0000-0000"
          inputMode="tel"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <legend className="text-sm font-semibold text-slate-900">일정</legend>
        <Field
          label="점검일"
          required
          value={state.inspectionDate}
          onChange={(v) => update("inspectionDate", v)}
          type="date"
        />
        <Field
          label="입주예정일"
          value={state.moveInDate}
          onChange={(v) => update("moveInDate", v)}
          type="date"
        />
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "생성 중…" : "세션 생성"}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "tel" | "text" | "search" | "email" | "url" | "decimal";
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  inputMode,
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <input
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        type={type}
        value={value}
        inputMode={inputMode}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
