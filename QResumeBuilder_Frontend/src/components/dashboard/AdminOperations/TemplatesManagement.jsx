import React, { useState, useEffect, useRef, memo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Cookies from 'js-cookie'

// Memoized PropertyEditor with column selection
const PropertyEditor = memo(({ element, onAddListItem, onUpdateListItem, onRemoveListItem, onStyleChange, onContentChange, onColumnChange, isTwoColumn }) => {
  if (!element) return <div className="p-4 text-gray-500">Select an element to edit its properties</div>;

  const handleStyleChange = (property, value) => {
    onStyleChange(element.id, { ...element.styles, [property]: value });
  };

  const handleListItemChange = (index, value) => {
    onUpdateListItem(index, value);
  };

  return (
    <div className="p-4 border-l border-gray-200 overflow-y-auto max-h-[calc(90vh-150px)] bg-white shadow-inner">
      <h3 className="font-semibold text-lg mb-4 border-b pb-2">Properties - {element.type}</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={element.content || ''}
          onChange={(e) => onContentChange(element.id, e.target.value)}
          className="w-full p-2 border rounded h-24 resize-y"
          placeholder="Enter content here"
        />
      </div>

      {isTwoColumn && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Column Placement</label>
          <select
            value={element.column || 'left'}
            onChange={(e) => onColumnChange(element.id, e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="left">Left (Sidebar)</option>
            <option value="right">Right (Main Content)</option>
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">List Items ({(element.listItems || []).length})</label>
        {(element.listItems || []).map((item, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={item || ''}
              onChange={(e) => handleListItemChange(index, e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder={`Item ${index + 1}`}
            />
            <button
              onClick={() => onRemoveListItem(index)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={onAddListItem}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Item
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
        <input
          type="color"
          value={element.styles?.color || '#333'}
          onChange={(e) => handleStyleChange('color', e.target.value)}
          className="w-10 h-10 p-0 border rounded cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
        <input
          type="color"
          value={element.styles?.backgroundColor || '#ffffff'}
          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          className="w-10 h-10 p-0 border rounded cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
        <select
          value={element.styles?.textAlign || 'left'}
          onChange={(e) => handleStyleChange('textAlign', e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      {element.type === 'header' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Border Bottom</label>
          <input
            type="text"
            value={element.styles?.borderBottom || '2px solid #2c3e50'}
            onChange={(e) => handleStyleChange('borderBottom', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
    </div>
  );
});

const TemplatesManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', fileName: '' });
  const [editingTemplate, setEditingTemplate] = useState({ id: null, name: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditOptionsModal, setShowEditOptionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [filePreviewContent, setFilePreviewContent] = useState(null);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showTemplateSelectModal, setShowTemplateSelectModal] = useState(false);
  const [builderTemplate, setBuilderTemplate] = useState({ name: '', elements: [], templateType: 'single' });
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOverElementId, setDragOverElementId] = useState(null);
  const [customSections, setCustomSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const editorRef = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage);

  const API_BASE_URL = 'https://resumebuilderapi-g5d9azdneghbhqdc.southindia-01.azurewebsites.net/api';
  const authToken = Cookies.get('token');
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    fetchTemplates();
  }, [currentPage]);

  useEffect(() => {
    setPageInput(currentPage);
    setTotalPages(Math.ceil(templates.length / pageSize));
  }, [currentPage, templates, pageSize]);

  const isValidContent = (content, setError) => {
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        JSON.parse(content);
        return true;
      } catch (e) {
        setError('Invalid JSON content. Please check your syntax.');
        return false;
      }
    } else if (content.trim().startsWith('<') && content.includes('</')) {
      return true;
    } else {
      setError('Content must be valid HTML or JSON.');
      return false;
    }
  };

  const getContentType = (content) => {
    return content.trim().startsWith('{') || content.trim().startsWith('[') ? 'json' : 'html';
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/Templates`, { headers });
      setTemplates(response.data);
      setTotalPages(Math.ceil(response.data.length / pageSize));
    } catch (err) {
      setError('Failed to fetch templates. Please try again later.');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['html', 'json', 'txt'].includes(fileExtension)) {
      setError('Please upload only HTML or JSON files.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (!isValidContent(content, setError)) return;
      setUploadedFile(file);
      setFilePreviewContent(content);
      setNewTemplate({ name: '', content: '', fileName: file.name });
    };
    reader.onerror = (error) => {
      setError('Error reading file. Please try again.');
      console.error('File read error:', error);
    };
    reader.readAsText(file);
  };

  const handlePreviewUploadedFile = () => {
    if (filePreviewContent) {
      setPreviewTemplate({ name: uploadedFile.name, content: filePreviewContent });
      setShowPreviewModal(true);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const templateToCreate = filePreviewContent
        ? { name: newTemplate.fileName.replace(/\.[^/.]+$/, ''), content: filePreviewContent, contentType: getContentType(filePreviewContent) }
        : { ...newTemplate, contentType: getContentType(newTemplate.content) };
      const response = await axios.post(`${API_BASE_URL}/api/Templates`, templateToCreate, { headers });
      const newTemplateData = response.data;
      console.log('Created Template Data:', newTemplateData);

      setTemplates([...templates, newTemplateData]);
      setNewTemplate({ name: '', content: '', fileName: '' });
      setUploadedFile(null);
      setFilePreviewContent(null);
      if (document.getElementById('file-upload')) document.getElementById('file-upload').value = '';
      setSuccessMessage('Template created successfully!');
      setEditingTemplate({ id: null, name: '', content: '' }); // Ensure reset
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create template. Please try again.');
      console.error('Error creating template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Updating Template with ID:', editingTemplate.id);
    try {
      if (!editingTemplate.id || editingTemplate.id <= 0) {
        throw new Error('Invalid template ID.');
      }
      if (!isValidContent(editingTemplate.content)) {
        throw new Error('Content must be valid HTML or JSON.');
      }
      const templateData = {
        id: editingTemplate.id,
        name: editingTemplate.name,
        content: editingTemplate.content,
        contentType: getContentType(editingTemplate.content)
      };
      const response = await axios.put(`${API_BASE_URL}/api/Templates/${editingTemplate.id}`, templateData, { headers });
      setTemplates(templates.map(template => template.id === editingTemplate.id ? response.data : template));
      setSuccessMessage('Template updated successfully!');
      setShowEditModal(false);
      setEditingTemplate({ id: null, name: '', content: '' });
    } catch (err) {
      setError(err.message || `Failed to update template: ${err.response?.data || 'Unknown error'}`);
      console.error('Error updating template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/Templates/${templateToDelete.id}`, { headers });
      setTemplates(templates.filter(template => template.id !== templateToDelete.id));
      setSuccessMessage('Template deleted successfully!');
      setShowDeleteModal(false);
    } catch (err) {
      setError('Failed to delete template. Please try again.');
      console.error('Error deleting template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplateClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const openEditOptionsModal = (template) => {
    console.log('Opening Edit Options for Template:', template);
    setEditingTemplate({ id: template.id, name: template.name, content: template.content });
    setShowEditOptionsModal(true);
  };

  const openCodeEditModal = () => {
    console.log('Switching to Code Edit Modal with:', editingTemplate);
    setShowEditOptionsModal(false);
    setShowEditModal(true);
  };

  const openVisualBuilderEdit = () => {
    console.log('Switching to Visual Builder with:', editingTemplate);
    setShowEditOptionsModal(false);
    const elements = parseHtmlToElements(editingTemplate.content);
    const isTwoColumn = editingTemplate.content.includes('class="sidebar"') && editingTemplate.content.includes('class="main-content"');
    setBuilderTemplate({ name: editingTemplate.name, elements, templateType: isTwoColumn ? 'two-column' : 'single' });
    setShowBuilderModal(true);
  };

  const closeModal = () => {
    setShowPreviewModal(false);
    setShowEditModal(false);
    setShowEditOptionsModal(false);
    setShowDeleteModal(false);
    setShowBuilderModal(false);
    setShowTemplateSelectModal(false);
    setSelectedElement(null);
    setDraggedElement(null);
    setDragOverElementId(null);
    setEditingTemplate({ id: null, name: '', content: '' });
    setBuilderTemplate({ name: '', elements: [], templateType: 'single' }); // Reset builderTemplate
  };

  const backToOptions = () => {
    setShowEditModal(false);
    setShowBuilderModal(false);
    setShowEditOptionsModal(true);
  };

  const openTemplateSelectModal = () => {
    setEditingTemplate({ id: null, name: '', content: '' }); // Reset before new creation
    setBuilderTemplate({ name: '', elements: [], templateType: 'single' }); // Reset builderTemplate
    setShowTemplateSelectModal(true);
  };

  const selectTemplateType = (type) => {
    setBuilderTemplate({ name: '', elements: [], templateType: type });
    setSelectedElement(null);
    setShowTemplateSelectModal(false);
    setShowBuilderModal(true);
  };

  const parseHtmlToElements = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = [];
    let isTwoColumn = false;

    const sidebar = doc.querySelector('.sidebar');
    const mainContent = doc.querySelector('.main-content');
    const container = doc.querySelector('.resume-container');

    if (sidebar && mainContent) {
      isTwoColumn = true;
    }

    const parseElement = (element, index, column) => {
      const className = element.className;
      let type, content, listItems = [], styles = {};

      const styleAttr = element.getAttribute('style') || '';
      styles = styleAttr.split(';').reduce((acc, style) => {
        const [key, value] = style.split(':').map(s => s.trim());
        if (key && value) {
          const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
        }
        return acc;
      }, {});

      switch (className) {
        case 'header':
          type = 'header';
          const headerLines = element.innerText.split('\n').filter(line => line.trim());
          content = headerLines.join('\n');
          listItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent.trim());
          break;
        case 'summary':
          type = 'summary';
          content = element.querySelector('p')?.textContent || '';
          listItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent.trim());
          break;
        case 'section':
          const sectionTitle = element.querySelector('.section-title')?.textContent.toUpperCase() || '';
          switch (sectionTitle) {
            case 'EXPERIENCE':
              type = 'experience';
              const job = element.querySelector('.job');
              const jobTitle = job?.querySelector('.job-title')?.textContent || '';
              const company = job?.querySelector('.company')?.textContent || '';
              const location = job?.querySelector('.location')?.textContent || '';
              const date = job?.querySelector('.date')?.textContent || '';
              content = `${jobTitle} | ${company}${location ? ' - ' + location : ''} | ${date}`;
              listItems = Array.from(job?.querySelectorAll('.job-description li') || []).map(li => li.textContent.trim());
              break;
            case 'EDUCATION':
              type = 'education';
              const edu = element.querySelector('.education-item');
              const degree = edu?.querySelector('.degree')?.textContent || '';
              const school = edu?.querySelector('.school')?.textContent || '';
              const eduLocation = edu?.querySelector('.location')?.textContent || '';
              const eduDate = edu?.querySelector('.date')?.textContent || '';
              content = `${degree} | ${school}${eduLocation ? ' - ' + eduLocation : ''} | ${eduDate}`;
              listItems = Array.from(edu?.querySelectorAll('.edu-description li') || []).map(li => li.textContent.trim());
              break;
            case 'PROJECTS':
              type = 'projects';
              const project = element.querySelector('.project-item');
              const projTitle = project?.querySelector('.project-title')?.textContent || '';
              const projDate = project?.querySelector('.date')?.textContent || '';
              content = `${projTitle} | ${projDate}`;
              listItems = Array.from(project?.querySelectorAll('.project-description li') || []).map(li => li.textContent.trim());
              break;
            case 'SKILLS':
              type = 'skills';
              content = sectionTitle;
              listItems = Array.from(element.querySelectorAll('.skills-list li') || []).map(li => li.textContent.trim());
              break;
            case 'CERTIFICATIONS':
              type = 'certifications';
              content = sectionTitle;
              listItems = Array.from(element.querySelectorAll('li') || []).map(li => li.textContent.trim());
              break;
            case 'LANGUAGES':
              type = 'languages';
              content = sectionTitle;
              listItems = Array.from(element.querySelectorAll('.languages-list li') || []).map(li => li.textContent.trim());
              break;
            default:
              type = sectionTitle.toLowerCase();
              content = sectionTitle;
              listItems = Array.from(element.querySelectorAll('li') || []).map(li => li.textContent.trim());
              break;
          }
          break;
        default:
          return null;
      }

      return {
        id: `element-${index}-${Date.now()}`,
        type,
        content,
        listItems,
        styles: { ...getDefaultStylesForType(type), ...styles },
        column: column || getDefaultColumnForType(type)
      };
    };

    if (isTwoColumn) {
      Array.from(sidebar.children).forEach((element, index) => {
        const parsedElement = parseElement(element, index, 'left');
        if (parsedElement) elements.push(parsedElement);
      });

      Array.from(mainContent.children).forEach((element, index) => {
        const parsedElement = parseElement(element, index + sidebar.children.length, 'right');
        if (parsedElement) elements.push(parsedElement);
      });
    } else {
      const sectionElements = container?.children || [];
      Array.from(sectionElements).forEach((element, index) => {
        const parsedElement = parseElement(element, index);
        if (parsedElement) elements.push(parsedElement);
      });
    }

    return elements;
  };

  const renderTemplatePreview = () => {
    if (!previewTemplate) return null;
    try {
      const isJsonContent = previewTemplate.content.trim().startsWith('{');
      if (isJsonContent) {
        const parsedContent = JSON.parse(previewTemplate.content);
        return <div className="bg-gray-50 p-4 border rounded overflow-auto max-h-96"><pre className="text-sm">{JSON.stringify(parsedContent, null, 2)}</pre></div>;
      } else {
        return <div className="bg-white border rounded overflow-hidden h-96"><iframe title="Template Preview" srcDoc={previewTemplate.content} className="w-full h-full" sandbox="allow-same-origin" /></div>;
      }
    } catch (e) {
      return <div className="bg-gray-50 p-4 border rounded overflow-auto max-h-96"><pre className="text-sm">{previewTemplate.content}</pre></div>;
    }
  };

  // DRAG-AND-DROP BUILDER FUNCTIONS

  const generateUniqueId = () => `element-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const getDefaultContentForType = (type) => {
    switch (type) {
      case 'header': return 'John Doe\n123 Main Street, City, State 12345 | (555) 123-4567 | email@example.com | linkedin.com/in/example';
      case 'summary': return 'Experienced professional with over 8 years in project management.';
      case 'experience': return 'Senior Project Manager | ABC Corporation - New York, NY | January 2020 - Present';
      case 'education': return 'Master of Business Administration (MBA) | University of Business - New York, NY | Graduated: May 2015';
      case 'skills': return 'SKILLS';
      case 'certifications': return 'CERTIFICATIONS';
      case 'languages': return 'LANGUAGES';
      case 'projects': return 'Project Name | January 2023 - June 2023';
      case 'awards': return 'AWARDS';
      case 'references': return 'REFERENCES';
      default: return type.toUpperCase();
    }
  };

  const getDefaultListItemsForType = (type) => {
    switch (type) {
      case 'header': return [];
      case 'summary': return [];
      case 'experience': return [
        'Lead a team of 10 project coordinators managing 15+ concurrent client projects.',
        'Implemented new project management methodology resulting in 20% reduction in delivery time.'
      ];
      case 'education': return ['Concentration in Operations Management, 3.9 GPA'];
      case 'skills': return ['Project Management', 'Team Leadership', 'Budget Management', 'Strategic Planning'];
      case 'certifications': return [
        'Project Management Professional (PMP), Project Management Institute, 2018',
        'Certified Scrum Master (CSM), Scrum Alliance, 2017'
      ];
      case 'languages': return ['English - Native', 'Spanish - Fluent'];
      case 'projects': return ['Developed a web application to streamline internal processes.'];
      case 'awards': return ['Employee of the Year, ABC Corporation, 2022'];
      case 'references': return ['Available upon request'];
      default: return [];
    }
  };

  const getDefaultStylesForType = (type) => {
    const baseStyles = {
      padding: '0 20px',
      marginBottom: '25px',
      color: '#333',
      fontFamily: "'Arial', sans-serif",
      lineHeight: '1.6',
      textAlign: 'left',
      backgroundColor: '#ffffff'
    };
    switch (type) {
      case 'header': return {
        ...baseStyles,
        textAlign: 'center',
        borderBottom: '2px solid #2c3e50',
        padding: '20px'
      };
      default: return baseStyles;
    }
  };

  const getDefaultColumnForType = (type) => {
    switch (type) {
      case 'header':
      case 'skills':
      case 'languages':
      case 'certifications':
        return 'left';
      default:
        return 'right';
    }
  };

  const handleDragStart = (e, elementType) => {
    const newElement = {
      id: generateUniqueId(),
      type: elementType,
      content: getDefaultContentForType(elementType),
      listItems: getDefaultListItemsForType(elementType),
      styles: getDefaultStylesForType(elementType),
      column: getDefaultColumnForType(elementType)
    };
    e.dataTransfer.setData('application/json', JSON.stringify(newElement));
    setDraggedElement(newElement);
  };

  const handleDrop = (e, targetId = null) => {
    e.preventDefault();
    e.stopPropagation();

    let droppedElement;
    try {
      droppedElement = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch (error) {
      console.error('Error parsing dropped element:', error);
      return;
    }
    if (!droppedElement) return;

    setBuilderTemplate(prev => {
      const newElements = [...prev.elements];
      const draggedIndex = newElements.findIndex(el => el.id === droppedElement.id);

      if (targetId && draggedElement) {
        const targetIndex = newElements.findIndex(el => el.id === targetId);
        if (targetIndex === -1) return prev;

        const targetElement = editorRef.current.querySelector(`[data-element-id="${targetId}"]`);
        if (!targetElement) return prev;

        const rect = targetElement.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const position = y < rect.height / 2 ? 'before' : 'after';

        if (draggedIndex !== -1) {
          const [movedElement] = newElements.splice(draggedIndex, 1);
          const newTargetIndex = position === 'before' ? targetIndex : targetIndex + 1;
          newElements.splice(newTargetIndex, 0, movedElement);
        } else {
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          newElements.splice(insertIndex, 0, { ...droppedElement });
        }
      } else if (!targetId && draggedIndex === -1) {
        newElements.push({ ...droppedElement });
      }

      return { ...prev, elements: newElements };
    });

    setDraggedElement(null);
    setDragOverElementId(null);
  };

  const handleDragOver = (e, elementId = null) => {
    e.preventDefault();
    setDragOverElementId(elementId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverElementId(null);
  };

  const handleElementSelect = (element) => {
    setSelectedElement(element);
  };

  const addListItem = () => {
    if (!selectedElement) return;
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElement.id
          ? { ...el, listItems: [...(el.listItems || []), 'New item'] }
          : el
      )
    }));
    setSelectedElement(prev => ({
      ...prev,
      listItems: [...(prev.listItems || []), 'New item']
    }));
  };

  const updateListItem = (index, value) => {
    if (!selectedElement) return;
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElement.id
          ? { ...el, listItems: el.listItems.map((item, i) => i === index ? value : item) }
          : el
      )
    }));
    setSelectedElement(prev => ({
      ...prev,
      listItems: prev.listItems.map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (index) => {
    if (!selectedElement) return;
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === selectedElement.id
          ? { ...el, listItems: el.listItems.filter((_, i) => i !== index) }
          : el
      )
    }));
    setSelectedElement(prev => ({
      ...prev,
      listItems: prev.listItems.filter((_, i) => i !== index)
    }));
  };

  const handleStyleChange = (elementId, newStyles) => {
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, styles: newStyles } : el
      )
    }));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement({ ...selectedElement, styles: newStyles });
    }
  };

  const handleContentChange = (elementId, newContent) => {
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, content: newContent } : el
      )
    }));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement({ ...selectedElement, content: newContent });
    }
  };

  const handleColumnChange = (elementId, newColumn) => {
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === elementId ? { ...el, column: newColumn } : el
      )
    }));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement({ ...selectedElement, column: newColumn });
    }
  };

  const removeElement = (elementId) => {
    setBuilderTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(element => element.id !== elementId)
    }));
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  };

  const addCustomSection = () => {
    if (newSectionName && !customSections.includes(newSectionName.toLowerCase())) {
      setCustomSections([...customSections, newSectionName.toLowerCase()]);
      setNewSectionName('');
    }
  };

  const generateHtmlFromElements = (elements) => {
    const css = `
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
      body { background-color: #f5f5f5; color: #333; line-height: 1.6; padding: 20px; }
      .resume-container { max-width: 800px; margin: 0 auto; background-color: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
      .header { margin-bottom: 20px; padding-bottom: 15px; white-space: pre-line; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 18px; color: #2c3e50; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
      .job, .education-item, .project-item { margin-bottom: 15px; }
      .job-title, .degree, .project-title { font-weight: bold; font-size: 14px; }
      .company, .school { font-weight: bold; }
      .date { color: #777; font-style: italic; font-size: 12px; }
      .job-description, .edu-description, .project-description { margin-top: 5px; }
      .skills-list, .languages-list { list-style-type: none; }
      .skills-list li, .languages-list li { padding: 3px 0; }
      .summary { margin-bottom: 20px; line-height: 1.8; }
      ul { list-style-type: disc; margin-left: 15px; }
      @media print { body { background-color: white; padding: 0; } .resume-container { box-shadow: none; } }
    `;

    const renderElementHtml = (element) => {
      const styleString = Object.entries(element.styles || {})
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
        .join(' ');

      switch (element.type) {
        case 'header':
          return `
            <div class="header" style="${styleString}">
              ${element.content || ''}
              ${(element.listItems || []).length > 0 ? '<ul>' + (element.listItems || []).map(item => `<li>${item || ''}</li>`).join('') + '</ul>' : ''}
            </div>`;
        case 'summary':
          return `
            <div class="summary" style="${styleString}">
              <p>${element.content || ''}</p>
              ${(element.listItems || []).length > 0 ? '<ul>' + (element.listItems || []).map(item => `<li>${item || ''}</li>`).join('') + '</ul>' : ''}
            </div>`;
        case 'experience':
          const [expTitle, expCompanyLocation, expDate] = (element.content || '').split('|').map(s => s.trim());
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">EXPERIENCE</div>
              <div class="job">
                <div class="job-title">${expTitle || ''}</div>
                <div><span class="company">${expCompanyLocation ? expCompanyLocation.split(' - ')[0] : ''}</span>${expCompanyLocation && expCompanyLocation.includes(' - ') ? ' - ' : ''}<span class="location">${expCompanyLocation ? expCompanyLocation.split(' - ')[1] || '' : ''}</span></div>
                <div class="date">${expDate || ''}</div>
                <ul class="job-description">${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
              </div>
            </div>`;
        case 'education':
          const [eduDegree, eduSchoolLocation, eduDate] = (element.content || '').split('|').map(s => s.trim());
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">EDUCATION</div>
              <div class="education-item">
                <div class="degree">${eduDegree || ''}</div>
                <div><span class="school">${eduSchoolLocation ? eduSchoolLocation.split(' - ')[0] : ''}</span>${eduSchoolLocation && eduSchoolLocation.includes(' - ') ? ' - ' : ''}<span class="location">${eduSchoolLocation ? eduSchoolLocation.split(' - ')[1] || '' : ''}</span></div>
                <div class="date">${eduDate || ''}</div>
                <ul class="edu-description">${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
              </div>
            </div>`;
        case 'skills':
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul class="skills-list">${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
        case 'certifications':
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul>${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
        case 'languages':
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul class="languages-list">${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
        case 'projects':
          const [projTitle, projDate] = (element.content || '').split('|').map(s => s.trim());
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">PROJECTS</div>
              <div class="project-item">
                <div class="project-title">${projTitle || ''}</div>
                <div class="date">${projDate || ''}</div>
                <ul class="project-description">${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
              </div>
            </div>`;
        case 'awards':
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul>${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
        case 'references':
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul>${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
        default:
          return `
            <div class="section" style="${styleString}">
              <div class="section-title">${element.content || ''}</div>
              <ul>${(element.listItems || []).map(item => `<li>${item || ''}</li>`).join('')}</ul>
            </div>`;
      }
    };

    if (builderTemplate.templateType === 'single') {
      const htmlContent = elements.map(renderElementHtml).join('');
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${builderTemplate.name || 'Professional Resume'}</title>
          <style>${css}</style>
        </head>
        <body><div class="resume-container" style="padding: 20px;">${htmlContent}</div></body>
        </html>
      `;
    } else {
      const leftContent = elements.filter(el => el.column === 'left').map(renderElementHtml).join('');
      const rightContent = elements.filter(el => el.column === 'right').map(renderElementHtml).join('');

      const twoColumnCss = `
        ${css}
        .resume-container { display: flex; padding: 0; }
        .sidebar { width: 30%; padding: 20px; background-color: #f9f9f9; }
        .main-content { width: 70%; padding: 20px; }
      `;

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${builderTemplate.name || 'Professional Resume'}</title>
          <style>${twoColumnCss}</style>
        </head>
        <body>
          <div class="resume-container">
            <div class="sidebar">${leftContent}</div>
            <div class="main-content">${rightContent}</div>
          </div>
        </body>
        </html>
      `;
    }
  };

  const createTemplateFromBuilder = async () => {
    if (!builderTemplate.name) {
      setError('Please enter a template name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const htmlContent = generateHtmlFromElements(builderTemplate.elements);
      const response = await axios.post(`${API_BASE_URL}/api/Templates`, { name: builderTemplate.name, content: htmlContent, contentType: 'html' }, { headers });
      const newTemplateData = response.data;
      console.log('Builder Created Template Data:', newTemplateData);
      setTemplates([...templates, newTemplateData]);
      setSuccessMessage('Resume template created successfully!');
      setShowBuilderModal(false);
      // Reset states to ensure new creation
      setEditingTemplate({ id: null, name: '', content: '' });
      setBuilderTemplate({ name: '', elements: [], templateType: 'single' });
    } catch (err) {
      setError('Failed to create template. Please try again.');
      console.error('Error creating template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplateFromBuilder = async () => {
    if (!builderTemplate.name) {
      setError('Please enter a template name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('Updating Builder Template with ID:', editingTemplate.id);
    if (!editingTemplate.id || editingTemplate.id === 0) {
      setError('Invalid template ID for update. Please try again.');
      setIsLoading(false);
      return;
    }
    try {
      const htmlContent = generateHtmlFromElements(builderTemplate.elements);
      const templateData = {
        id: editingTemplate.id,
        name: builderTemplate.name,
        content: htmlContent,
        contentType: 'html'
      };
      const response = await axios.put(`${API_BASE_URL}/api/Templates/${editingTemplate.id}`, templateData, { headers });
      setTemplates(templates.map(template => template.id === editingTemplate.id ? response.data : template));
      setSuccessMessage('Template updated successfully!');
      setShowBuilderModal(false);
      setEditingTemplate({ id: null, name: '', content: '' });
      setBuilderTemplate({ name: '', elements: [], templateType: 'single' });
    } catch (err) {
      setError('Failed to update template. Please try again.');
      console.error('Error updating template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditorElement = (element) => {
    const isSelected = selectedElement && selectedElement.id === element.id;
    const isDraggedOver = dragOverElementId === element.id;
    const elementStyle = {
      ...element.styles,
      border: isSelected ? '2px solid #4a90e2' : (isDraggedOver ? '2px dashed #4a90e2' : 'none'),
      transition: 'all 0.2s ease',
      position: 'relative',
      cursor: 'move'
    };

    let renderedElement;
    switch (element.type) {
      case 'header':
        const [headerName, headerContact] = (element.content || '').split('\n');
        renderedElement = (
          <div className="header" style={elementStyle}>
            <div className="name">{headerName || ''}</div>
            <div className="contact-info">{headerContact || ''}</div>
            {(element.listItems || []).length > 0 && (
              <ul>{element.listItems.map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
            )}
          </div>
        );
        break;
      case 'summary':
        renderedElement = (
          <div className="summary" style={elementStyle}>
            <p>{element.content || ''}</p>
            {(element.listItems || []).length > 0 && (
              <ul>{element.listItems.map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
            )}
          </div>
        );
        break;
      case 'experience':
        const [expTitle, expCompanyLocation, expDate] = (element.content || '').split('|').map(s => s.trim());
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">EXPERIENCE</div>
            <div className="job">
              <div className="job-title">{expTitle || ''}</div>
              <div>
                <span className="company">{expCompanyLocation ? expCompanyLocation.split(' - ')[0] : ''}</span>
                {expCompanyLocation && expCompanyLocation.includes(' - ') && ' - '}
                <span className="location">{expCompanyLocation ? expCompanyLocation.split(' - ')[1] || '' : ''}</span>
              </div>
              <div className="date">{expDate || ''}</div>
              <ul className="job-description">{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
            </div>
          </div>
        );
        break;
      case 'education':
        const [eduDegree, eduSchoolLocation, eduDate] = (element.content || '').split('|').map(s => s.trim());
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">EDUCATION</div>
            <div className="education-item">
              <div className="degree">{eduDegree || ''}</div>
              <div>
                <span className="school">{eduSchoolLocation ? eduSchoolLocation.split(' - ')[0] : ''}</span>
                {eduSchoolLocation && eduSchoolLocation.includes(' - ') && ' - '}
                <span className="location">{eduSchoolLocation ? eduSchoolLocation.split(' - ')[1] || '' : ''}</span>
              </div>
              <div className="date">{eduDate || ''}</div>
              <ul className="edu-description">{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
            </div>
          </div>
        );
        break;
      case 'skills':
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul className="skills-list">{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
        break;
      case 'certifications':
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul>{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
        break;
      case 'languages':
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul className="languages-list">{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
        break;
      case 'projects':
        const [projTitle, projDate] = (element.content || '').split('|').map(s => s.trim());
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">PROJECTS</div>
            <div class="project-item">
              <div className="project-title">{projTitle || ''}</div>
              <div className="date">{projDate || ''}</div>
              <ul className="project-description">{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
            </div>
          </div>
        );
        break;
      case 'awards':
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul>{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
        break;
      case 'references':
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul>{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
        break;
      default:
        renderedElement = (
          <div className="section" style={elementStyle}>
            <div className="section-title">{element.content || ''}</div>
            <ul>{(element.listItems || []).map((item, idx) => <li key={idx}>{item || ''}</li>)}</ul>
          </div>
        );
    }

    return (
      <div
        key={element.id}
        data-element-id={element.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify(element));
          setDraggedElement(element);
        }}
        onDragOver={(e) => handleDragOver(e, element.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, element.id)}
        onClick={(e) => { e.stopPropagation(); handleElementSelect(element); }}
        className="relative mb-2 hover:shadow-md"
      >
        {renderedElement}
        {isSelected && (
          <div
            className="absolute -top-4 -right-4 bg-red-500 text-white p-1 rounded-full cursor-pointer z-10"
            onClick={(e) => { e.stopPropagation(); removeElement(element.id); }}
          >
            ×
          </div>
        )}
      </div>
    );
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setPageInput(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setPageInput(currentPage + 1);
    }
  };

  const handlePageInputChange = (e) => setPageInput(e.target.value);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      toast.error(`The maximum number of pages is ${totalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setPageInput(currentPage);
    } else {
      setCurrentPage(pageNum);
      setPageInput(pageNum);
    }
  };

  // Calculate templates to display on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTemplates = templates.slice(startIndex, endIndex);

  return (
    <div>
      <ToastContainer />
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 border border-red-200">{error}</div>}
      {successMessage && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 border border-green-200">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-48">
          <h3 className="font-semibold text-lg mb-3">Code Template</h3>
          <p className="text-gray-600 mb-4 flex-grow">Write HTML or JSON code directly</p>
          <button 
            onClick={() => document.getElementById('code-editor').scrollIntoView({ behavior: 'smooth' })} 
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 w-full"
          >
            Create Code Template
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-48">
          <h3 className="font-semibold text-lg mb-3">Upload Template</h3>
          <p className="text-gray-600 mb-4 flex-grow">Upload a pre-created HTML or JSON file</p>
          <button 
            onClick={() => document.getElementById('file-upload-section').scrollIntoView({ behavior: 'smooth' })} 
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 w-full"
          >
            Upload Template File
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-48">
          <h3 className="font-semibold text-lg mb-3">Visual Builder</h3>
          <p className="text-gray-600 mb-4 flex-grow">Create a resume using drag and drop</p>
          <button 
            onClick={openTemplateSelectModal} 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
          >
            Open Resume Builder
          </button>
        </div>
      </div>

      <div id="code-editor" className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">
          {editingTemplate.id && showEditModal ? 'Edit Template with Code' : 'Create Template with Code'}
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
          <input 
            type="text" 
            name="name" 
            value={editingTemplate.id && showEditModal ? editingTemplate.name : newTemplate.name} 
            onChange={(e) => editingTemplate.id && showEditModal 
              ? setEditingTemplate({ ...editingTemplate, name: e.target.value })
              : setNewTemplate({ ...newTemplate, name: e.target.value })} 
            className="w-full p-2 border rounded" 
            disabled={!!filePreviewContent} 
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Content</label>
          <textarea 
            name="content" 
            value={editingTemplate.id && showEditModal ? editingTemplate.content : newTemplate.content} 
            onChange={(e) => editingTemplate.id && showEditModal 
              ? setEditingTemplate({ ...editingTemplate, content: e.target.value })
              : setNewTemplate({ ...newTemplate, content: e.target.value })} 
            placeholder="Your HTML content here or { 'your': 'JSON content here' }" 
            className="w-full p-2 border rounded font-mono h-60" 
            disabled={!!filePreviewContent} 
          />
        </div>
        <button 
          onClick={editingTemplate.id && showEditModal ? handleUpdateTemplate : handleCreateTemplate} 
          disabled={isLoading || (!newTemplate.content && !filePreviewContent && (!editingTemplate.content || !showEditModal))} 
          className={`px-4 py-2 rounded ${isLoading || (!newTemplate.content && !filePreviewContent && (!editingTemplate.content || !showEditModal)) 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}`}
        >
          {editingTemplate.id && showEditModal ? 'Update Template' : 'Create Template'}
        </button>
      </div>

      <div id="file-upload-section" className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold text-lg mb-3">Upload Template File</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template File (HTML, JSON)</label>
          <input id="file-upload" type="file" accept=".html,.json,.txt" onChange={handleFileUpload} className="w-full p-2 border rounded" />
        </div>
        {uploadedFile && (
          <div className="mb-4">
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div><span className="font-medium">{uploadedFile.name}</span><span className="text-sm ml-2 text-gray-500">({Math.round(uploadedFile.size / 1024)} KB)</span></div>
              <div>
                <button onClick={handlePreviewUploadedFile} className="text-indigo-600 hover:text-indigo-800 mr-2">Preview</button>
                <button onClick={() => { setUploadedFile(null); setFilePreviewContent(null); document.getElementById('file-upload').value = ''; }} className="text-red-600 hover:text-red-800">Remove</button>
              </div>
            </div>
          </div>
        )}
        <button onClick={handleCreateTemplate} disabled={isLoading || !filePreviewContent} className={`px-4 py-2 rounded ${isLoading || !filePreviewContent ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>Create Template from File</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold text-lg mb-3">Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTemplates.map(template => (
            <div key={template.id} className="border rounded p-4 relative">
              <h4 className="font-medium text-lg">{template.name}</h4>
              <p className="text-gray-500 text-sm mb-2">{template.contentType === 'json' ? 'JSON' : 'HTML'} Template</p>
              <div className="mt-4 flex space-x-2">
                <button onClick={() => handlePreviewTemplate(template)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200">Preview</button>
                <button onClick={() => openEditOptionsModal(template)} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">Edit</button>
                <button onClick={() => handleDeleteTemplateClick(template)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Delete</button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-full text-center py-6 text-gray-500">No templates available. Create your first template above.</div>}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1} 
              className={`p-1 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <form onSubmit={handlePageSubmit} className="flex items-center">
              <span className="text-gray-700 font-medium">Page</span>
              <input
                type="number"
                value={pageInput}
                onChange={handlePageInputChange}
                className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                min="1"
              />
              <span className="text-gray-700 font-medium">of {totalPages}</span>
            </form>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages} 
              className={`p-1 rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{previewTemplate?.name}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4">{renderTemplatePreview()}</div>
            <div className="border-t px-4 py-3 text-right"><button onClick={closeModal} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button></div>
          </div>
        </div>
      )}
      {showEditOptionsModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800">Edit Template: {editingTemplate.name}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <p className="mb-5 text-gray-700">Choose how you want to edit this template:</p>
              <div className="flex flex-row space-x-4 justify-center">
                <button 
                  onClick={openCodeEditModal}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2 text-sm rounded-md hover:from-purple-700 hover:to-purple-800 shadow-sm transition-all duration-200 font-medium flex-1"
                >
                  Edit with Code Editor
                </button>
                <button 
                  onClick={openVisualBuilderEdit}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-5 py-2 text-sm rounded-md hover:from-teal-600 hover:to-teal-700 shadow-sm transition-all duration-200 font-medium flex-1"
                >
                  Edit with Visual Builder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={backToOptions} className="text-gray-600 hover:text-gray-800 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg">Edit Template (Code)</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleUpdateTemplate}>
              <div className="p-4">
                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label><input type="text" name="name" value={editingTemplate.name} onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="w-full p-2 border rounded" required /></div>
                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Template Content</label><textarea name="content" value={editingTemplate.content} onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })} className="w-full p-2 border rounded font-mono h-60" required /></div>
              </div>
              <div className="border-t px-4 py-3 text-right">
                <button type="submit" disabled={isLoading} className={`px-4 py-2 rounded ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Confirm Deletion</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4"><p>Are you sure you want to delete the template "{templateToDelete?.name}"?</p><p className="text-red-600 mt-2">This action cannot be undone.</p></div>
            <div className="border-t px-4 py-3 text-right"><button onClick={closeModal} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2">Cancel</button><button onClick={confirmDeleteTemplate} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button></div>
          </div>
        </div>
      )}

      {showTemplateSelectModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800">Select Template Layout</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <p className="mb-5 text-gray-700">Choose a layout for your resume:</p>
              <div className="flex flex-row space-x-4 justify-center">
                <button 
                  onClick={() => selectTemplateType('single')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 text-sm rounded-md hover:from-purple-700 hover:to-purple-800 shadow-sm transition-all duration-200 font-medium flex-1 flex items-center justify-center"
                >
                  <span>Single Column Template</span>
                </button>
                <button 
                  onClick={() => selectTemplateType('two-column')}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 text-sm rounded-md hover:from-teal-600 hover:to-teal-700 shadow-sm transition-all duration-200 font-medium flex-1 flex items-center justify-center"
                >
                  <span>Two-Column Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBuilderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full h-[90vh] max-w-7xl mx-4 flex flex-col">
            <div className="border-b px-4 py-3 flex items-center justify-between bg-gray-50">
              <div className="flex items-center">
                <button onClick={editingTemplate.id ? backToOptions : closeModal} className="text-gray-600 hover:text-gray-800 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-lg">Resume Builder - {builderTemplate.templateType === 'single' ? 'Single Column' : 'Two-Column'}</h3>
                <input
                  type="text"
                  placeholder="Resume Template Name"
                  value={builderTemplate.name}
                  onChange={(e) => setBuilderTemplate({ ...builderTemplate, name: e.target.value })}
                  className="ml-4 p-2 border rounded w-64 focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-56 border-r p-4 bg-gray-100 overflow-y-auto">
                <h4 className="font-medium text-sm mb-4 text-gray-700 uppercase">Resume Sections</h4>
                <div className="mb-4">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Add custom section"
                    className="w-full p-2 border rounded mb-2"
                  />
                  <button
                    onClick={addCustomSection}
                    className="bg-blue-500 text-white px-2 py-1                     rounded text-sm hover:bg-blue-600"
                  >
                    Add Section
                  </button>
                </div>
                {[
                  'header',
                  'summary',
                  'experience',
                  'education',
                  'skills',
                  'certifications',
                  'languages',
                  'projects',
                  'awards',
                  'references',
                  ...customSections,
                ].map((type) => (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type)}
                    className="p-2 mb-2 bg-white border rounded cursor-move hover:bg-gray-50"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium text-sm text-gray-700 uppercase">Editor</h4>
                </div>
                <div
                  ref={editorRef}
                  className="flex-1 p-4 overflow-y-auto bg-white"
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e)}
                  onClick={() => setSelectedElement(null)}
                >
                  {builderTemplate.templateType === 'single' ? (
                    <div className="resume-container max-w-4xl mx-auto">
                      {builderTemplate.elements.length === 0 ? (
                        <div className="text-gray-500 text-center py-10">
                          Drag and drop sections here to start building your resume
                        </div>
                      ) : (
                        builderTemplate.elements.map((element) =>
                          renderEditorElement(element)
                        )
                      )}
                    </div>
                  ) : (
                    <div className="resume-container flex max-w-4xl mx-auto">
                      <div className="sidebar w-1/3 p-4 bg-gray-50 border-r">
                        {builderTemplate.elements.filter((el) => el.column === 'left')
                          .length === 0 ? (
                          <div className="text-gray-500 text-center py-10">
                            Drag sections to the sidebar
                          </div>
                        ) : (
                          builderTemplate.elements
                            .filter((el) => el.column === 'left')
                            .map((element) => renderEditorElement(element))
                        )}
                      </div>
                      <div className="main-content w-2/3 p-4">
                        {builderTemplate.elements.filter((el) => el.column === 'right')
                          .length === 0 ? (
                          <div className="text-gray-500 text-center py-10">
                            Drag sections to the main content
                          </div>
                        ) : (
                          builderTemplate.elements
                            .filter((el) => el.column === 'right')
                            .map((element) => renderEditorElement(element))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-80 border-l">
                <PropertyEditor
                  element={selectedElement}
                  onAddListItem={addListItem}
                  onUpdateListItem={updateListItem}
                  onRemoveListItem={removeListItem}
                  onStyleChange={handleStyleChange}
                  onContentChange={handleContentChange}
                  onColumnChange={handleColumnChange}
                  isTwoColumn={builderTemplate.templateType === 'two-column'}
                />
              </div>
            </div>
            <div className="border-t px-4 py-3 flex justify-between bg-gray-50">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={
                  editingTemplate.id ? updateTemplateFromBuilder : createTemplateFromBuilder
                }
                disabled={isLoading || !builderTemplate.name}
                className={`px-4 py-2 rounded ${
                  isLoading || !builderTemplate.name
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {editingTemplate.id ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesManagement;