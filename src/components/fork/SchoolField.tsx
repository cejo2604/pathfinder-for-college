import { AutofillField } from "@/components/fork/AutofillField";
import { US_UNIVERSITIES } from "@/lib/fork/universities";

/** School input with autofill across U.S. colleges and universities; free text still allowed. */
export function SchoolField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <AutofillField label="School" value={value} onChange={onChange} options={US_UNIVERSITIES} />;
}
