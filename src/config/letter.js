/* Letterhead for the allotment letter. Set these in .env; the fallbacks
   only exist so the page renders before they are filled in. */
export const COMPANY = {
  name: import.meta.env.VITE_COMPANY_NAME || 'Company name',
  address: import.meta.env.VITE_COMPANY_ADDRESS || 'Company address',
  signatory: import.meta.env.VITE_COMPANY_SIGNATORY || 'Authorised signatory',
};
