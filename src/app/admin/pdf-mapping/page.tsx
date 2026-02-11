"use client";

import { useState, useEffect } from "react";
import {
  FileInput,
  Save,
  RefreshCw,
  TestTube,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface FieldMapping {
  id: string;
  fieldName: string;
  pdfFieldKey: string;
  page: number;
  x: number;
  y: number;
  type: "text" | "checkbox" | "date" | "phone" | "ssn";
  fontSize?: number;
  maxWidth?: number;
  characterSpacing?: number;
  description?: string;
}

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  formType: string;
  version: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

export default function PDFMappingPage() {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(
    null
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testData] = useState<Record<string, any>>({});

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/pdf-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        // For now, set a default template if none exists
        if (data.templates.length === 0) {
          const defaultTemplate = createDefaultRECATemplate();
          setTemplates([defaultTemplate]);
          setSelectedTemplate(defaultTemplate);
        } else if (!selectedTemplate && data.templates.length > 0) {
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      // Create default template for demo
      const defaultTemplate = createDefaultRECATemplate();
      setTemplates([defaultTemplate]);
      setSelectedTemplate(defaultTemplate);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRECATemplate = (): PDFTemplate => {
    return {
      id: "reca-default",
      name: "RECA Downwinder Claim Form",
      description: "Official DOJ RECA claim form with all 16 parts",
      formType: "RECA",
      version: "2024-10",
      fieldMappings: [
        // Part 1 - Filer Information
        {
          id: "field-1",
          fieldName: "Filer First Name",
          pdfFieldKey: "part1.firstName",
          page: 0,
          x: 80,
          y: 420,
          type: "text",
          fontSize: 12,
          characterSpacing: 18,
          description: "First name of the person filing the claim",
        },
        {
          id: "field-2",
          fieldName: "Filer Middle Name",
          pdfFieldKey: "part1.middleName",
          page: 0,
          x: 280,
          y: 420,
          type: "text",
          fontSize: 12,
          characterSpacing: 18,
          description: "Middle name of the filer",
        },
        {
          id: "field-3",
          fieldName: "Filer Last Name",
          pdfFieldKey: "part1.lastName",
          page: 0,
          x: 380,
          y: 420,
          type: "text",
          fontSize: 12,
          characterSpacing: 18,
          description: "Last name of the filer",
        },
        {
          id: "field-4",
          fieldName: "Filer SSN",
          pdfFieldKey: "part1.ssn",
          page: 0,
          x: 80,
          y: 380,
          type: "ssn",
          fontSize: 12,
          description: "Social Security Number (XXX-XX-XXXX)",
        },
        {
          id: "field-5",
          fieldName: "Filer Date of Birth",
          pdfFieldKey: "part1.dob",
          page: 0,
          x: 200,
          y: 380,
          type: "date",
          fontSize: 12,
          description: "Date of birth (MM/DD/YYYY)",
        },
        // Part 8 - Exposure Locations (Critical)
        {
          id: "field-6",
          fieldName: "Exposure Option 1a",
          pdfFieldKey: "part8.option1a",
          page: 6,
          x: 42,
          y: 600,
          type: "checkbox",
          description: "Designated area for 1+ year (1951-1962)",
        },
        {
          id: "field-7",
          fieldName: "Nevada Nye County",
          pdfFieldKey: "part8.nevada.nye.townCity",
          page: 6,
          x: 280,
          y: 340,
          type: "text",
          fontSize: 10,
          description: "Town/City in Nye County, Nevada",
        },
        // Part 10 - Diseases (Critical)
        {
          id: "field-8",
          fieldName: "Leukemia",
          pdfFieldKey: "part10.leukemia",
          page: 8,
          x: 42,
          y: 520,
          type: "checkbox",
          description: "Leukemia (except chronic lymphocytic)",
        },
        {
          id: "field-9",
          fieldName: "Lung Cancer",
          pdfFieldKey: "part10.lung",
          page: 8,
          x: 42,
          y: 500,
          type: "checkbox",
          description: "Primary lung cancer",
        },
        // Part 16 - Signature (Critical)
        {
          id: "field-10",
          fieldName: "Signature Date",
          pdfFieldKey: "part16.signatureDate",
          page: 12,
          x: 450,
          y: 200,
          type: "date",
          fontSize: 12,
          description: "Date of signature",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleFieldUpdate = (
    fieldId: string,
    updates: Partial<FieldMapping>
  ) => {
    if (!selectedTemplate) return;

    const updatedMappings = selectedTemplate.fieldMappings.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    setSelectedTemplate({
      ...selectedTemplate,
      fieldMappings: updatedMappings,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddField = () => {
    if (!selectedTemplate) return;

    const newField: FieldMapping = {
      id: `field-${Date.now()}`,
      fieldName: "New Field",
      pdfFieldKey: "",
      page: 0,
      x: 100,
      y: 100,
      type: "text",
      fontSize: 12,
    };

    setSelectedTemplate({
      ...selectedTemplate,
      fieldMappings: [...selectedTemplate.fieldMappings, newField],
      updatedAt: new Date().toISOString(),
    });

    setEditingField(newField.id);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTemplate) return;

    const updatedMappings = selectedTemplate.fieldMappings.filter(
      (field) => field.id !== fieldId
    );

    setSelectedTemplate({
      ...selectedTemplate,
      fieldMappings: updatedMappings,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/pdf-templates/${selectedTemplate.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedTemplate),
        }
      );

      if (response.ok) {
        // Update templates list
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplate.id ? selectedTemplate : t))
        );
        alert("Template saved successfully!");
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestMapping = async () => {
    if (!selectedTemplate) return;

    try {
      setIsTestMode(true);
      const response = await fetch("/api/admin/pdf-templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          testData: testData,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, "_blank");
      } else {
        throw new Error("Failed to generate test PDF");
      }
    } catch (error) {
      console.error("Error testing mapping:", error);
      alert("Error generating test PDF. See console for details.");
    } finally {
      setIsTestMode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              PDF Field Mapping
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure how form data maps to PDF fields
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestMapping}
              disabled={!selectedTemplate || isTestMode}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              Test Mapping
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!selectedTemplate || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar - Template List */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              PDF Templates
            </h2>
          </div>
          <div className="overflow-y-auto p-4">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`mb-2 cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {template.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {template.formType}
                  </span>
                  <span className="text-xs text-gray-400">
                    v{template.version}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Field Mappings */}
        <div className="flex-1 overflow-y-auto">
          {selectedTemplate ? (
            <div className="p-6">
              {/* Template Info */}
              <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTemplate.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedTemplate.fieldMappings.length} fields mapped
                </p>
              </div>

              {/* Add Field Button */}
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleAddField}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              {/* Field Mappings Table */}
              <div className="rounded-lg bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Field Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        PDF Key
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Page
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Position (X, Y)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedTemplate.fieldMappings.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {editingField === field.id ? (
                            <input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) =>
                                handleFieldUpdate(field.id, {
                                  fieldName: e.target.value,
                                })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {field.fieldName}
                              </div>
                              {field.description && (
                                <div className="text-xs text-gray-500">
                                  {field.description}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingField === field.id ? (
                            <input
                              type="text"
                              value={field.pdfFieldKey}
                              onChange={(e) =>
                                handleFieldUpdate(field.id, {
                                  pdfFieldKey: e.target.value,
                                })
                              }
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            <code className="text-xs text-gray-600">
                              {field.pdfFieldKey}
                            </code>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingField === field.id ? (
                            <input
                              type="number"
                              value={field.page}
                              onChange={(e) =>
                                handleFieldUpdate(field.id, {
                                  page: parseInt(e.target.value),
                                })
                              }
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">
                              {field.page + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingField === field.id ? (
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={field.x}
                                onChange={(e) =>
                                  handleFieldUpdate(field.id, {
                                    x: parseInt(e.target.value),
                                  })
                                }
                                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                              <input
                                type="number"
                                value={field.y}
                                onChange={(e) =>
                                  handleFieldUpdate(field.id, {
                                    y: parseInt(e.target.value),
                                  })
                                }
                                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900">
                              ({field.x}, {field.y})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingField === field.id ? (
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleFieldUpdate(field.id, {
                                  type: e.target.value as any,
                                })
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="date">Date</option>
                              <option value="phone">Phone</option>
                              <option value="ssn">SSN</option>
                            </select>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {field.type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {editingField === field.id ? (
                              <>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="rounded p-1 text-green-600 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="rounded p-1 text-gray-600 hover:bg-gray-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingField(field.id)}
                                  className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="rounded p-1 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info Box */}
              <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">
                      Field Mapping Tips
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-inside list-disc space-y-1">
                        <li>Page numbers are 0-indexed (Page 1 = 0)</li>
                        <li>
                          Coordinates are in PDF points (72 points = 1 inch)
                        </li>
                        <li>Origin (0,0) is at bottom-left of the page</li>
                        <li>Use the Test Mapping feature to preview changes</li>
                        <li>
                          Character spacing is used for boxed fields (SSN,
                          phone)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <FileInput className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No template selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a template from the sidebar to view and edit field
                  mappings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
