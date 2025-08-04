/**
 * Props for the PrivacyPolicyModal component
 */
export interface PrivacyPolicyModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  
  /**
   * Callback function to close the modal
   */
  onClose: () => void;
}
