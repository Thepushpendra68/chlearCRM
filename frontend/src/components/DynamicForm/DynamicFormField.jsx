import TextInput from './FieldTypes/TextInput';
import EmailInput from './FieldTypes/EmailInput';
import PhoneInput from './FieldTypes/PhoneInput';
import NumberInput from './FieldTypes/NumberInput';
import DateInput from './FieldTypes/DateInput';
import TextareaInput from './FieldTypes/TextareaInput';
import SelectInput from './FieldTypes/SelectInput';
import PicklistInput from './FieldTypes/PicklistInput';
import UserSelectInput from './FieldTypes/UserSelectInput';
import PipelineStageInput from './FieldTypes/PipelineStageInput';

/**
 * Field type mapping - maps field types to their corresponding components
 */
const FIELD_TYPE_MAP = {
  text: TextInput,
  email: EmailInput,
  phone: PhoneInput,
  tel: PhoneInput,
  number: NumberInput,
  currency: NumberInput,
  date: DateInput,
  datetime: DateInput,
  'datetime-local': DateInput,
  textarea: TextareaInput,
  select: SelectInput,
  picklist: PicklistInput,
  user_select: UserSelectInput,
  pipeline_stage: PipelineStageInput,
};

/**
 * DynamicFormField - Renders the appropriate field component based on field type
 * 
 * @param {object} field - Field definition from industry configuration
 * @param {any} value - Current field value
 * @param {function} onChange - Change handler function
 * @param {string|object} error - Error message or error object
 * @param {boolean} disabled - Whether the field is disabled
 * @param {object} rest - Additional props to pass to the field component
 */
const DynamicFormField = ({ 
  field, 
  value, 
  onChange, 
  error, 
  disabled = false,
  ...rest 
}) => {
  // Get the appropriate field component
  const FieldComponent = FIELD_TYPE_MAP[field.type] || TextInput;

  // Normalize error to string
  const errorMessage = typeof error === 'object' && error?.message 
    ? error.message 
    : error || null;

  return (
    <FieldComponent
      field={field}
      value={value}
      onChange={onChange}
      error={errorMessage}
      disabled={disabled}
      {...rest}
    />
  );
};

export default DynamicFormField;
