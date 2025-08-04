/**
 * Props for the TermsOfUseModal component
 */
export interface TermsOfUseModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
}
