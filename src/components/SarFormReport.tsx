import React from 'react';
import type { SarCaseDetail } from '../types';
import type { SarFormData } from '../sarForm';
import { defaultSarFormData, SUMMARY_CHARACTERIZATION_OPTIONS } from '../sarForm';

const inputClass =
  'w-full border-0 border-b border-gray-400 bg-transparent px-0 py-1.5 min-h-[1.75rem] text-sm leading-normal text-gray-900 focus:border-gray-700 focus:ring-0 overflow-visible';
const readOnlyValueClass =
  'w-full border-b border-gray-400 px-0 pb-1 pt-0.5 text-sm leading-normal text-gray-900 block min-h-[1.5rem]';
const labelClass = 'text-xs font-normal text-gray-900';

/** Renders a <span> in read-only mode (for PDF) or an <input> in edit mode. */
function TextField({ value, onChange, readOnly, className }: { value: string; onChange?: (v: string) => void; readOnly?: boolean; className?: string }) {
  if (readOnly) {
    return <span className={className || readOnlyValueClass}>{value || '\u00A0'}</span>;
  }
  return (
    <input
      type="text"
      className={className || inputClass}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

type SarFormReportProps = {
  detail: SarCaseDetail;
  formData: SarFormData;
  onFormDataChange?: (patch: Partial<SarFormData>) => void;
  narrativeValue: string;
  onNarrativeChange?: (value: string) => void;
  editable?: boolean;
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-gray-800 text-white text-sm font-semibold py-2 px-3 mt-6 first:mt-0">
      {title}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  disabled,
  label
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  if (disabled) {
    // Pure CSS checkbox for PDF/read-only mode — html2canvas renders this correctly
    return (
      <label className="inline-flex items-center gap-1.5">
        <div
          style={{
            width: 14,
            height: 14,
            border: '1.5px solid #4b5563',
            borderRadius: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: checked ? '#e5e7eb' : '#fff',
            flexShrink: 0,
            lineHeight: 1,
            verticalAlign: 'middle',
          }}
        >
          {checked && <span style={{ fontSize: 11, color: '#111', fontWeight: 700, lineHeight: 1, marginTop: -1 }}>✓</span>}
        </div>
        {label && <span className="text-xs text-gray-900" style={{ lineHeight: '14px' }}>{label}</span>}
      </label>
    );
  }
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-3.5 h-3.5 border border-gray-600 rounded-none text-gray-800 focus:ring-gray-500"
      />
      {label && <span className="text-xs text-gray-900">{label}</span>}
    </label>
  );
}

function RadioGroup<T extends string>({
  value,
  options,
  onChange,
  disabled
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange?: (v: T) => void;
  disabled?: boolean;
}) {
  if (disabled) {
    // Pure CSS radios for PDF/read-only mode
    return (
      <div className="flex flex-wrap gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="inline-flex items-center gap-1.5">
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '1.5px solid #4b5563',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                flexShrink: 0,
                verticalAlign: 'middle',
              }}
            >
              {value === opt.value && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#374151' }} />
              )}
            </div>
            <span className="text-xs text-gray-900" style={{ lineHeight: '14px' }}>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name={String(Math.random())}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            className="w-3.5 h-3.5 border border-gray-600 text-gray-800 focus:ring-gray-500"
          />
          <span className="text-xs text-gray-900">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export const SarFormReport: React.FC<SarFormReportProps> = ({
  detail,
  formData,
  onFormDataChange,
  narrativeValue,
  onNarrativeChange,
  editable = false
}) => {
  const update = (patch: Partial<SarFormData>) => {
    onFormDataChange?.(patch);
  };

  const readOnly = !editable;
  const narrativeReadOnly = readOnly || !onNarrativeChange;

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    // minHeight removed to allow natural height flow
    fontFamily: 'Georgia, serif',
    backgroundColor: '#fff',
    color: '#111',
    boxSizing: 'border-box',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    marginBottom: '2rem', // Spacing for UI
  };

  return (
    <div className="flex flex-col items-center py-4 bg-gray-200/50">
      {/* Single Continuous Page Container */}
      <div className="sar-page bg-white text-gray-900 shadow-lg flex flex-col" style={pageStyle} data-sar-page>

        {/* Header */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4 border-b-2 border-gray-800 pb-3 px-4 pt-4">
            <div className="flex items-center gap-2.5">
              <img src="/barclays-eagle.svg" alt="Barclays" className="h-7 w-auto" style={{ filter: 'brightness(0) saturate(100%) invert(16%) sepia(12%) saturate(913%) hue-rotate(169deg) brightness(95%) contrast(92%)' }} />
              <img src="/barclays-wordmark.svg" alt="Barclays" className="h-6 w-auto" style={{ filter: 'brightness(0) saturate(100%) invert(16%) sepia(12%) saturate(913%) hue-rotate(169deg) brightness(95%) contrast(92%)' }} />
              <span className="text-xs text-gray-600 ml-1">Suspicious Activity Report</span>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div>July 2003</div>
              <div className="mt-1">Previous editions will not be accepted after December 31, 2003.</div>
            </div>
          </div>
          <div className="px-4 py-2 border-b border-gray-400 bg-gray-100 text-sm font-semibold">
            ALWAYS COMPLETE ENTIRE REPORT (see instructions)
          </div>
        </div>

        {/* Part I */}
        <div className="flex-shrink-0 border-b border-gray-300">
          <SectionHeader title="Part I  Reporting Financial Institution Information" />
          <div className="px-4 py-3 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-normal">1.</span>
              <Checkbox
                checked={formData.correctsPriorReport}
                onChange={(v) => update({ correctsPriorReport: v })}
                disabled={readOnly}
                label="Corrects Prior Report (see instruction #3 under 'How to Make a Report')"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className={labelClass}>2. Name of Financial Institution </span>
                <TextField value={formData.nameOfInstitution} onChange={(v) => update({ nameOfInstitution: v })} readOnly={readOnly} />
              </div>
              <div className="flex gap-4">
                <div className="w-32">
                  <span className={labelClass}>3. EIN </span>
                  <TextField value={formData.ein} onChange={(v) => update({ ein: v })} readOnly={readOnly} />
                </div>
                <div className="flex-1">
                  <span className={labelClass}>4. Address of Financial Institution </span>
                  <TextField value={formData.addressOfInstitution} onChange={(v) => update({ addressOfInstitution: v })} readOnly={readOnly} />
                </div>
              </div>
              <div>
                <span className={labelClass}>5. Primary Federal Regulator </span>
                <div className="flex flex-wrap gap-4 mt-1">
                  {['Federal Reserve', 'FDIC', 'NCUA', 'OCC', 'OTS'].map((r, i) => (
                    <Checkbox
                      key={r}
                      checked={formData.primaryRegulator === r}
                      onChange={(v) => update({ primaryRegulator: v ? r : '' })}
                      disabled={readOnly}
                      label={String.fromCharCode(97 + i) + ' ' + r}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><span className={labelClass}>6. City </span><TextField value={formData.city} onChange={(v) => update({ city: v })} readOnly={readOnly} /></div>
                <div className="w-24"><span className={labelClass}>7. State </span><TextField value={formData.state} onChange={(v) => update({ state: v })} readOnly={readOnly} /></div>
                <div className="w-28"><span className={labelClass}>8. Zip Code </span><TextField value={formData.zipCode} onChange={(v) => update({ zipCode: v })} readOnly={readOnly} /></div>
              </div>
              <div>
                <span className={labelClass}>9. Address of Branch Office(s) where activity occurred </span>
                <TextField value={formData.branchAddress} onChange={(v) => update({ branchAddress: v })} readOnly={readOnly} />
                <div className="mt-1">
                  <Checkbox checked={formData.multipleBranches} onChange={(v) => update({ multipleBranches: v })} disabled={readOnly} label="Multiple Branches (include information in narrative, Part V)" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><span className={labelClass}>10. City </span><TextField value={formData.branchCity} onChange={(v) => update({ branchCity: v })} readOnly={readOnly} /></div>
                <div className="w-24"><span className={labelClass}>11. State </span><TextField value={formData.branchState} onChange={(v) => update({ branchState: v })} readOnly={readOnly} /></div>
                <div className="w-28"><span className={labelClass}>12. Zip Code </span><TextField value={formData.branchZipCode} onChange={(v) => update({ branchZipCode: v })} readOnly={readOnly} /></div>
              </div>
              <div>
                <span className={labelClass}>13. If institution closed, date closed </span>
                <TextField value={formData.dateClosed} onChange={(v) => update({ dateClosed: v })} readOnly={readOnly} />
              </div>
              <div>
                <span className={labelClass}>14. Account number(s) affected, if any </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {formData.accountNumbers.map((acc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {readOnly ? (
                        <span className={readOnlyValueClass + ' flex-1'}>{acc || '\u00A0'}</span>
                      ) : (
                        <input type="text" className={inputClass + ' flex-1'} value={acc} onChange={(e) => {
                          const arr = [...formData.accountNumbers]; arr[i] = e.target.value; update({ accountNumbers: arr });
                        }} />
                      )}
                      <Checkbox checked={formData.accountClosed[i]} onChange={(v) => {
                        const arr = [...formData.accountClosed]; arr[i] = v; update({ accountClosed: arr });
                      }} disabled={readOnly} label="Closed? Yes/No" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Part II */}
        <div className="flex-shrink-0 border-b border-gray-300">
          <SectionHeader title="Part II  Suspect Information" />
          <div className="px-4 py-3 space-y-3 text-sm">
            <div className="mb-2">
              <Checkbox checked={formData.suspectUnavailable} onChange={(v) => update({ suspectUnavailable: v })} disabled={readOnly} label="Suspect Information Unavailable" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><span className={labelClass}>15. Last Name or Name of Entity </span><TextField value={formData.suspectLastName} onChange={(v) => update({ suspectLastName: v })} readOnly={readOnly} /></div>
              <div><span className={labelClass}>16. First Name </span><TextField value={formData.suspectFirstName} onChange={(v) => update({ suspectFirstName: v })} readOnly={readOnly} /></div>
              <div><span className={labelClass}>17. Middle </span><TextField value={formData.suspectMiddle} onChange={(v) => update({ suspectMiddle: v })} readOnly={readOnly} /></div>
            </div>
            <div><span className={labelClass}>18. Address </span><TextField value={formData.suspectAddress} onChange={(v) => update({ suspectAddress: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>19. SSN, EIN or TIN </span><TextField value={formData.ssnEinTin} onChange={(v) => update({ ssnEinTin: v })} readOnly={readOnly} /></div>
            <div className="flex gap-4">
              <div className="flex-1"><span className={labelClass}>20. City </span><TextField value={formData.suspectCity} onChange={(v) => update({ suspectCity: v })} readOnly={readOnly} /></div>
              <div className="w-24"><span className={labelClass}>21. State </span><TextField value={formData.suspectState} onChange={(v) => update({ suspectState: v })} readOnly={readOnly} /></div>
              <div className="w-28"><span className={labelClass}>22. Zip Code </span><TextField value={formData.suspectZipCode} onChange={(v) => update({ suspectZipCode: v })} readOnly={readOnly} /></div>
              <div className="flex-1"><span className={labelClass}>23. Country </span><TextField value={formData.suspectCountry} onChange={(v) => update({ suspectCountry: v })} readOnly={readOnly} /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1"><span className={labelClass}>24. Phone Number - Residence (include area code) </span><TextField value={formData.phoneResidence} onChange={(v) => update({ phoneResidence: v })} readOnly={readOnly} /></div>
              <div className="flex-1"><span className={labelClass}>25. Phone Number - Work (include area code) </span><TextField value={formData.phoneWork} onChange={(v) => update({ phoneWork: v })} readOnly={readOnly} /></div>
            </div>
            <div><span className={labelClass}>26. Occupation/Type of Business </span><TextField value={formData.occupation} onChange={(v) => update({ occupation: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>27. Date of Birth </span><TextField value={formData.dateOfBirth} onChange={(v) => update({ dateOfBirth: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>28. Admission/Confession? </span><RadioGroup value={formData.admissionConfession} options={[{ value: 'yes', label: 'a Yes' }, { value: 'no', label: 'b No' }]} onChange={(v) => update({ admissionConfession: v })} disabled={readOnly} /></div>
            <div><span className={labelClass}>30. Relationship to Financial Institution: </span><div className="flex flex-wrap gap-3 mt-1">{['Accountant', 'Agent', 'Appraiser', 'Attorney', 'Borrower', 'Broker', 'Customer', 'Director', 'Employee', 'Officer', 'Shareholder', 'Other'].map((r, i) => (
              <Checkbox key={r} checked={formData.relationshipToInstitution.includes(r)} onChange={(v) => { const arr = v ? [...formData.relationshipToInstitution, r] : formData.relationshipToInstitution.filter(x => x !== r); update({ relationshipToInstitution: arr }); }} disabled={readOnly} label={String.fromCharCode(97 + i) + ' ' + r} />
            ))}</div></div>
            <div><span className={labelClass}>31. Is the relationship an insider relationship? </span><RadioGroup value={formData.insiderRelationship} options={[{ value: 'yes', label: 'a Yes' }, { value: 'no', label: 'b No' }]} onChange={(v) => update({ insiderRelationship: v })} disabled={readOnly} /></div>
            <div><span className={labelClass}>32. Date of Suspension, Termination, Resignation </span><TextField value={formData.dateSuspensionTermination} onChange={(v) => update({ dateSuspensionTermination: v })} readOnly={readOnly} /></div>
          </div>
        </div>

        {/* Part III */}
        <div className="flex-shrink-0 border-b border-gray-300">
          <SectionHeader title="Part III  Suspicious Activity Information" />
          <div className="px-4 py-3 space-y-3 text-sm">
            <div className="flex gap-6">
              <div><span className={labelClass}>33. Date or date range of suspicious activity: From </span><TextField value={formData.activityDateFrom} onChange={(v) => update({ activityDateFrom: v })} readOnly={readOnly} /></div>
              <div><span className={labelClass}>To </span><TextField value={formData.activityDateTo} onChange={(v) => update({ activityDateTo: v })} readOnly={readOnly} /></div>
            </div>
            <div><span className={labelClass}>34. Total dollar amount involved in known or suspicious activity: </span><span className="text-gray-700">$</span><TextField value={formData.totalDollarAmount} onChange={(v) => update({ totalDollarAmount: v })} readOnly={readOnly} className={readOnly ? readOnlyValueClass + ' inline-block w-40' : inputClass + ' inline-block w-40'} /><span className="text-gray-600">.00</span></div>
            <div>
              <span className={labelClass}>35. Summary characterization of suspicious activity: </span>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1 mt-2">
                {SUMMARY_CHARACTERIZATION_OPTIONS.map((opt) => (
                  <Checkbox
                    key={opt.key}
                    checked={formData.summaryCharacterization.includes(opt.key)}
                    onChange={(v) => {
                      const arr = v ? [...formData.summaryCharacterization, opt.key] : formData.summaryCharacterization.filter(x => x !== opt.key);
                      update({ summaryCharacterization: arr });
                    }}
                    disabled={readOnly}
                    label={opt.key + ' ' + opt.label}
                  />
                ))}
              </div>
            </div>
            <div><span className={labelClass}>36. Amount of loss prior to recovery (if applicable): </span><span className="text-gray-700">$</span><TextField value={formData.amountOfLoss} onChange={(v) => update({ amountOfLoss: v })} readOnly={readOnly} className={readOnly ? readOnlyValueClass + ' inline-block w-32' : inputClass + ' inline-block w-32'} /><span className="text-gray-600">.00</span></div>
            <div><span className={labelClass}>37. Dollar amount of recovery (if applicable): </span><span className="text-gray-700">$</span><TextField value={formData.amountOfRecovery} onChange={(v) => update({ amountOfRecovery: v })} readOnly={readOnly} className={readOnly ? readOnlyValueClass + ' inline-block w-32' : inputClass + ' inline-block w-32'} /><span className="text-gray-600">.00</span></div>
            <div><span className={labelClass}>38. Has the suspicious activity had a material impact on, or otherwise affected, the financial soundness of the institution? </span><RadioGroup value={formData.materialImpact} options={[{ value: 'yes', label: 'a Yes' }, { value: 'no', label: 'b No' }]} onChange={(v) => update({ materialImpact: v })} disabled={readOnly} /></div>
            <div><span className={labelClass}>39. Has the institution's bonding company been notified? </span><RadioGroup value={formData.bondingNotified} options={[{ value: 'yes', label: 'a Yes' }, { value: 'no', label: 'b No' }]} onChange={(v) => update({ bondingNotified: v })} disabled={readOnly} /></div>
            <div><span className={labelClass}>40. Has any law enforcement agency already been advised by telephone, written communication, or otherwise? </span><div className="flex flex-wrap gap-3 mt-1">{['DEA', 'FBI', 'IRS', 'Postal Inspection', 'Secret Service', 'U.S. Customs', 'Other Federal', 'State', 'Local'].map((a, i) => (
              <Checkbox key={a} checked={formData.lawEnforcementAdvised.includes(a)} onChange={(v) => { const arr = v ? [...formData.lawEnforcementAdvised, a] : formData.lawEnforcementAdvised.filter(x => x !== a); update({ lawEnforcementAdvised: arr }); }} disabled={readOnly} label={String.fromCharCode(97 + i) + ' ' + a} />
            ))}</div></div>
            <div><span className={labelClass}>41. Name of person(s) contacted at Law Enforcement Agency: </span><TextField value={formData.contactName1} onChange={(v) => update({ contactName1: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>42. Phone Number (include area code): </span><TextField value={formData.contactPhone1} onChange={(v) => update({ contactPhone1: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>43. Name of person(s) contacted at Law Enforcement Agency: </span><TextField value={formData.contactName2} onChange={(v) => update({ contactName2: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>44. Phone Number (include area code): </span><TextField value={formData.contactPhone2} onChange={(v) => update({ contactPhone2: v })} readOnly={readOnly} /></div>
          </div>
        </div>

        {/* Part IV */}
        <div className="flex-shrink-0 border-b border-gray-300">
          <SectionHeader title="Part IV  Contact for Assistance" />
          <div className="px-4 py-3 space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div><span className={labelClass}>45. Last Name: </span><TextField value={formData.contactLastName} onChange={(v) => update({ contactLastName: v })} readOnly={readOnly} /></div>
              <div><span className={labelClass}>46. First Name: </span><TextField value={formData.contactFirstName} onChange={(v) => update({ contactFirstName: v })} readOnly={readOnly} /></div>
              <div><span className={labelClass}>47. Middle: </span><TextField value={formData.contactMiddle} onChange={(v) => update({ contactMiddle: v })} readOnly={readOnly} /></div>
            </div>
            <div><span className={labelClass}>48. Title/Occupation: </span><TextField value={formData.contactTitle} onChange={(v) => update({ contactTitle: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>49. Phone Number (include area code): </span><TextField value={formData.contactPhone} onChange={(v) => update({ contactPhone: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>50. Date Prepared: </span><TextField value={formData.datePrepared} onChange={(v) => update({ datePrepared: v })} readOnly={readOnly} /></div>
            <div><span className={labelClass}>51. Agency (if not filed by financial institution): </span><TextField value={formData.agencyIfNotInstitution} onChange={(v) => update({ agencyIfNotInstitution: v })} readOnly={readOnly} /></div>
          </div>
        </div>

        {/* Part V */}
        <div className="flex-shrink-0">
          <SectionHeader title="Part V  Suspicious Activity Information Explanation/Description" />
          <div className="px-4 py-3 text-sm">
            <p className="text-gray-900 mb-2">
              Provide below a chronological and complete account of the possible violation of law, including what is unusual, irregular or suspicious about the transaction, using the following checklist as you prepare your account. If necessary, continue the narrative on a duplicate of this page.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <ul className="list-disc pl-5 space-y-1">
                {['a Describe supporting documentation and retain for 5 years.', 'b Explain who benefited, financially or otherwise, from the transaction, how much, and how.', 'c Retain any confession, admission, or explanation of the transaction provided by the suspect and indicate to whom and when it was given.', 'd Retain any confession, admission, or explanation of the transaction provided by any other person and indicate to whom and when it was given.', 'e Retain any evidence of cover-up or evidence of an attempt to deceive federal or state examiners or others.'].map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <ul className="list-disc pl-5 space-y-1">
                {['f Indicate where the possible violation took place (e.g., main office, branch, other).', 'g Indicate whether the possible violation is an isolated incident or relates to other transactions.', 'h Indicate whether there is any related litigation; if so, specify.', 'i Recommend any further investigation that might assist law enforcement authorities.', 'j Indicate whether any information has been excluded from this report; if so, why?', 'k If you are correcting a previously filed report, describe the changes that are being made.'].map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-400 min-h-[320px] p-3 bg-white overflow-visible">
              {narrativeReadOnly ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-900">{narrativeValue || '—'}</p>
              ) : (
                <textarea
                  className="w-full min-h-[300px] border-0 p-2 text-sm leading-relaxed text-gray-900 resize-y focus:ring-0 focus:outline-none overflow-visible"
                  value={narrativeValue}
                  onChange={(e) => onNarrativeChange?.(e.target.value)}
                  placeholder="Enter narrative..."
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 border-t border-gray-300 pt-2">
              Tips on SAR Form preparation and filing are available in the SAR Activity Review at www.fincen.gov/pub_reports.html
            </p>
            <div className="mt-4 text-[10px] text-gray-500 leading-tight border-t border-gray-300 pt-3">
              <strong>Paperwork Reduction Act Notice.</strong>{' '}
              This form is required to notify law enforcement of known or suspected criminal conduct. The authority to collect this information is set forth in 12 U.S.C. 1818(s), 12 U.S.C. 1786(q), 31 U.S.C. 5318(g), and 31 U.S.C. 5331. The information collected on this form is confidential and may be shared with appropriate federal, state, and local authorities. The estimated average burden associated with this collection is 30 minutes per response. Comments concerning the accuracy of this burden estimate and suggestions for reducing this burden should be directed to the Office of Management and Budget and the federal regulatory agencies listed in the instructions.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export function useSarFormState(detail: SarCaseDetail, savedFormData?: SarFormData): [SarFormData, React.Dispatch<React.SetStateAction<SarFormData>>] {
  const initial = React.useMemo(() => {
    return savedFormData ?? defaultSarFormData(detail);
  }, [detail.id]);
  return React.useState<SarFormData>(initial);
}
