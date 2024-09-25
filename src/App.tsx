import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, Controller, useWatch, useFormContext, FormProvider } from 'react-hook-form';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formConfig, FormField } from './formConfig';
import './App.css';

const useFormProgress = (fields: (FormField | null)[]) => {
  const { watch } = useFormContext();
  const watchAllFields = watch();

  return useMemo(() => {
    const relevantFields = fields.filter((field): field is FormField => 
      field !== null && !['progress', 'avatar', 'senior', 'active', 'rating'].includes(field.name)
    );
    const totalFields = relevantFields.length;
    const filledFields = relevantFields.filter(field => {
      const value = watchAllFields[field.name];
      return value !== undefined && value !== '' && value !== null;
    }).length;
    return (filledFields / totalFields) * 100;
  }, [watchAllFields, fields]);
};

const FormFieldComponent = React.memo(({ field }: { field: FormField }) => {
  const { control, formState: { errors } } = useFormContext();

  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <Controller
        name={field.name}
        control={control}
        rules={{ required: field.required }}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          switch (field.render_type) {
            case 'editable_text':
            case 'editable_num':
              return (
                <input
                  type={field.data_type === 'number' ? 'number' : 'text'}
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value || ''}
                  ref={ref}
                />
              );
            case 'switch':
              return (
                <label className="switch">
                  <input
                    type="checkbox"
                    onChange={(e) => onChange(e.target.checked)}
                    checked={!!value}
                    ref={ref}
                  />
                  <span className="slider"></span>
                </label>
              );
            case 'rating':
              return (
                <div className="rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <React.Fragment key={star}>
                      <input
                        type="radio"
                        id={`${field.name}-star${star}`}
                        name={field.name}
                        value={star}
                        onChange={() => onChange(star)}
                        checked={value === star}
                        ref={ref}
                      />
                      <label htmlFor={`${field.name}-star${star}`}></label>
                    </React.Fragment>
                  ))}
                </div>
              );
            case 'dropdown':
              return (
                <div className="dropdown-with-image" data-selected={value || ''}>
                  <select onChange={onChange} onBlur={onBlur} value={value || ''} ref={ref}>
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.text} value={option.text}>
                        {option.text}
                      </option>
                    ))}
                  </select>
                </div>
              );
            case 'element':
              if (field.name === 'avatar') {
                return (
                  <div className="avatar-upload">
                    <label htmlFor="avatar-upload" className="avatar-label">
                      {value ? (
                        <img src={value} alt="Avatar" className="avatar-preview" />
                      ) : (
                        <div className="avatar-placeholder">Upload Avatar</div>
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onChange(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                      ref={ref}
                    />
                  </div>
                );
              }
              return <div>Unsupported element type</div>;
            default:
              return <div>Unsupported field type</div>;
          }
        }}
      />
      {errors[field.name] && <span className="error">This field is required</span>}
    </div>
  );
});

const SortableItem = React.memo(({ id, field, isEditing }: { id: string; field: FormField | null; isEditing: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id,
    disabled: !isEditing
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...(isEditing ? attributes : {})}
      {...(isEditing ? listeners : {})}
      className={`form-group ${isEditing ? 'editing' : ''} ${!field ? 'empty-field' : ''}`}
    >
      {field ? <FormFieldComponent field={field} /> : <div className="empty-field-placeholder">Drag fields here</div>}
    </div>
  );
});

function FormFields({ fields, setFields, isEditing }: { 
  fields: (FormField | null)[][], 
  setFields: React.Dispatch<React.SetStateAction<(FormField | null)[][]>>, 
  isEditing: boolean 
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFields((prevFields) => {
        const newFields = JSON.parse(JSON.stringify(prevFields)) as (FormField | null)[][];
        
        let activeRowIndex = -1;
        let activeFieldIndex = -1;
        let overRowIndex = -1;
        let overFieldIndex = -1;

        for (let i = 0; i < newFields.length; i++) {
          const activeIndex = newFields[i].findIndex(f => f?.id === active.id);
          if (activeIndex !== -1) {
            activeRowIndex = i;
            activeFieldIndex = activeIndex;
          }
          
          const overIndex = newFields[i].findIndex(f => f?.id === over?.id);
          if (overIndex !== -1) {
            overRowIndex = i;
            overFieldIndex = overIndex;
          }

          if (activeRowIndex !== -1 && overRowIndex !== -1) break;
        }

        if (activeRowIndex === -1 || overRowIndex === -1) return prevFields;

        const [movedField] = newFields[activeRowIndex].splice(activeFieldIndex, 1);
        newFields[overRowIndex].splice(overFieldIndex, 0, movedField);

        const filteredFields = newFields.filter((row) => row.some((field) => field !== null));

        return filteredFields;
      });
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="form-grid">
        {fields.map((row, rowIndex) => (
          <div key={rowIndex} className="form-row">
            <SortableContext 
              items={row.map((field, index) => ({ id: field?.id || `empty-${rowIndex}-${index}`, field }))}
              strategy={horizontalListSortingStrategy}
            >
              {row.map((field, index) => (
                <SortableItem 
                  key={field?.id || `empty-${rowIndex}-${index}`} 
                  id={field?.id || `empty-${rowIndex}-${index}`}
                  field={field} 
                  isEditing={isEditing} 
                />
              ))}
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

function FormContent({ fields, setFields, isSubmitting, submitStatus, onSubmit, isEditing, toggleEdit, addRow }: {
  fields: (FormField | null)[][],
  setFields: React.Dispatch<React.SetStateAction<(FormField | null)[][]>>,
  isSubmitting: boolean,
  submitStatus: 'idle' | 'success' | 'error',
  onSubmit: (data: any) => Promise<void>,
  isEditing: boolean,
  toggleEdit: () => void,
  addRow: () => void
}) {
  const methods = useFormContext();
  const progress = useFormProgress(fields.flat());

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      <div className="form-header">
        <h2>{formConfig.title}</h2>
      </div>
      
      <div className="edit-button-container">
        <button type="button" onClick={toggleEdit} className="edit-button">
          {isEditing ? 'Save Layout' : 'Edit Layout'}
        </button>
        {isEditing && (
          <button type="button" onClick={addRow} className="add-row-button">
            Add Row
          </button>
        )}
      </div>

      <div className="progress-container">
        <label className="progress-label">Profile Progress</label>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      
      <FormFields fields={fields} setFields={setFields} isEditing={isEditing} />

      <button type="submit" disabled={isSubmitting || isEditing}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {submitStatus === 'success' && <p className="success-message">Form submitted successfully!</p>}
      {submitStatus === 'error' && <p className="error-message">There was an error submitting the form. Please try again.</p>}
    </form>
  );
}

function App() {
  const methods = useForm({
    mode: 'onChange',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fields, setFields] = useState<(FormField | null)[][]>(() => {
    const savedLayout = localStorage.getItem('formLayout');
    if (savedLayout) {
      return JSON.parse(savedLayout);
    }
    const initialFields = formConfig.fields.filter(field => field.name !== 'progress');
    const rows = 3;
    const fieldsPerRow = Math.ceil(initialFields.length / rows);
    return Array.from({ length: rows }, (_, index) =>
      initialFields.slice(index * fieldsPerRow, (index + 1) * fieldsPerRow)
    );
  });
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    if (isEditing) {
      localStorage.setItem('formLayout', JSON.stringify(fields));
    }
    setIsEditing(prev => !prev);
  };

  const addRow = () => {
    setFields(prevFields => {
      const newFields = [...prevFields];
      const rowsWithMultipleFields = newFields.filter(row => row.filter(field => field !== null).length > 1);
      
      if (rowsWithMultipleFields.length > 0) {
        const closestRow = rowsWithMultipleFields[rowsWithMultipleFields.length - 1];
        const fieldToMove = closestRow.find(field => field !== null);
        if (fieldToMove) {
          const updatedClosestRow = closestRow.filter(field => field !== fieldToMove);
          const newRow = [fieldToMove];
          
          return newFields.map(row => 
            row === closestRow ? updatedClosestRow : row
          ).concat([newRow]);
        }
      }
      
      return [...newFields, []];
    });
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch(formConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, fieldLayout: fields.flat().filter((field): field is FormField => field !== null) }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      <div className="content-wrapper">
        <FormProvider {...methods}>
          <FormContent
            fields={fields}
            setFields={setFields}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
            onSubmit={onSubmit}
            isEditing={isEditing}
            toggleEdit={toggleEdit}
            addRow={addRow}
          />
        </FormProvider>
      </div>
    </div>
  );
}

export default App;
