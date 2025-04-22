import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AuthContext } from '../../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useInView } from 'react-intersection-observer';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const UserDashboard = ({ selectedTemplate, onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [savedResumes, setSavedResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailStates, setThumbnailStates] = useState({});
  const [error, setError] = useState(null);
  const [resumeError, setResumeError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [currentResumeName, setCurrentResumeName] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumeSearchTerm, setResumeSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [activeTools, setActiveTools] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [activeTab, setActiveTab] = useState('templates');
  const editorRef = useRef(null);
  const { currentUser, isLoading: authLoading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  const [templatePageSize] = useState(8);
  const [templateTotalPages, setTemplateTotalPages] = useState(0);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [templatePageInput, setTemplatePageInput] = useState(templateCurrentPage);
  const [resumeCurrentPage, setResumeCurrentPage] = useState(1);
  const [resumePageSize] = useState(8);
  const [resumeTotalPages, setResumeTotalPages] = useState(0);
  const [totalResumes, setTotalResumes] = useState(0);
  const [resumePageInput, setResumePageInput] = useState(resumeCurrentPage);

  const API_BASE_URL = 'http://localhost:5294';
  const authToken = Cookies.get('token');
  const headers = authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    : {};

  let userId;
  try {
    if (authToken) {
      const decodedToken = jwtDecode(authToken);
      userId = decodedToken.userId || decodedToken.sub;
    }
  } catch (err) {
    console.error('Error decoding token:', err);
    Cookies.remove('token', { path: '/' });
    logout();
    navigate('/login');
  }

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [authLoading, currentUser, navigate]);

  useEffect(() => {
    if (currentUser && userId) {
      fetchTemplates();
      fetchSavedResumes();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [currentUser, userId, authLoading, templateCurrentPage, resumeCurrentPage]);

  useEffect(() => {
    setTemplatePageInput(templateCurrentPage);
    setResumePageInput(resumeCurrentPage);
  }, [templateCurrentPage, resumeCurrentPage]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Admin/GetTemplatesByPage?pageNumber=${templateCurrentPage}&pageSize=${templatePageSize}`,
        { headers }
      );
      const fetchedTemplates = response.data.templates.map((template) => ({
        id: template.id,
        Name: template.name || 'Unnamed Template',
        Content: template.content || '',
        ThumbnailUrl: template.thumbnailUrl || '',
      }));
      setTemplates(fetchedTemplates);
      setFilteredTemplates(fetchedTemplates);
      setTemplateTotalPages(response.data.totalPages);
      setTotalTemplates(response.data.totalTemplates);
      const initialThumbnailStates = fetchedTemplates.reduce((acc, template) => {
        acc[template.id] = template.Content && !template.ThumbnailUrl ? 'loading' : 'loaded';
        return acc;
      }, {});
      setThumbnailStates(initialThumbnailStates);
      fetchedTemplates.forEach((template) => {
        if (template.Content && !template.ThumbnailUrl) {
          generateThumbnail(template);
        }
      });
    } catch (err) {
      setError('Failed to fetch templates. Please try again later.');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchSavedResumes = async () => {
    if (!userId) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/Resumes/GetUserResumes?userId=${userId}&page=${resumeCurrentPage}&pageSize=${resumePageSize}`,
        { headers }
      );
  
      const defaultStyles = `
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          .resume-content, .resume-container {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 850px;
            margin: 0 auto;
            padding: 30px;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            white-space: pre-line;
            background-color: #1e3a8a;
            color: white;
          }
          .name {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .contact-info {
            font-size: 14px;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #999;
            padding-bottom: 5px;
          }
          .experience-item, .education-item, .job, .project-item {
            margin-bottom: 15px;
          }
          .title-row, .job-title, .degree, .project-title {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .company, .degree, .school {
            font-style: italic;
          }
          .description, .job-description, .edu-description, .project-description {
            margin-top: 5px;
          }
          .skills-list, .languages-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            list-style-type: none;
          }
          .skill {
            background-color: #f0f0f0;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 14px;
          }
          ul {
            list-style-type: disc;
            margin-left: 15px;
          }
        </style>
      `;
  
      const resumesWithThumbnails = await Promise.all(
        response.data.data.map(async (resume) => {
          let thumbnailUrl = resume.thumbnailUrl;
          let content = resume.content || '';
  
          if (resume.resumeId < 14 && !content.includes('<style>')) {
            console.log(`Resume ${resume.resumeId} - Applying fallback styles`);
            content = `${defaultStyles}<div class="resume-content">${content}</div>`;
          }
  
          if (!thumbnailUrl && content) {
            thumbnailUrl = await generateResumeThumbnail({ ...resume, content });
          }
  
          return {
            ...resume,
            content,
            ThumbnailUrl: thumbnailUrl,
          };
        })
      );
  
      setSavedResumes(resumesWithThumbnails);
      setFilteredResumes(resumesWithThumbnails);
      setResumeTotalPages(response.data.totalPages);
      setTotalResumes(response.data.totalCount);
      setResumeError(null);

      if (resumesWithThumbnails.length === 0 && resumeCurrentPage > 1) {
        setResumeCurrentPage((prev) => prev - 1);
        setResumePageInput((prev) => prev - 1);
      }
  
      console.log(
        'Fetched resumes:',
        resumesWithThumbnails.map((r) => ({
          resumeId: r.resumeId,
          name: r.name,
          contentLength: r.content?.length || 0,
          hasStyleTag: r.content?.includes('<style>') || false,
          contentSnippet: r.content?.substring(0, 200) || 'No content',
        }))
      );
    } catch (err) {
      console.error('Error fetching saved resumes:', err.response?.data || err.message);
      setResumeError(err.response?.data?.message || 'Failed to fetch resumes.');
    }
  };
  const generateThumbnail = async (template) => {
    if (!template.Content) {
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'loaded' }));
      return;
    }
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              .thumbnail-container {
                width: 210mm;
                height: auto;
                padding: 10mm;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                background-color: white;
              }
            </style>
          </head>
          <body>
            <div class="thumbnail-container">${template.Content}</div>
          </body>
        </html>
      `);
      doc.close();

      await new Promise((resolve) => setTimeout(resolve, 500));
      const contentDiv = doc.querySelector('.thumbnail-container');
      const canvas = await html2canvas(contentDiv, {
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
      });

      const thumbnailUrl = canvas.toDataURL('image/png');
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, ThumbnailUrl: thumbnailUrl } : t))
      );
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'loaded' }));
      document.body.removeChild(iframe);
    } catch (err) {
      console.error(`Error generating thumbnail for ${template.Name}:`, err);
      setThumbnailStates((prev) => ({ ...prev, [template.id]: 'error' }));
    }
  };

  const generateResumeThumbnail = async (resume) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; }
              .thumbnail-container {
                width: 210mm;
                height: auto;
                padding: 10mm;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                background-color: white;
              }
            </style>
          </head>
          <body>
            <div class="thumbnail-container">${resume.content}</div>
          </body>
        </html>
      `);
      doc.close();

      await new Promise((resolve) => setTimeout(resolve, 500));
      const contentDiv = doc.querySelector('.thumbnail-container');
      const canvas = await html2canvas(contentDiv, {
        scale: 0.5,
        useCORS: true,
        allowTaint: true,
      });

      const thumbnailUrl = canvas.toDataURL('image/png');
      document.body.removeChild(iframe);
      return thumbnailUrl;
    } catch (err) {
      console.error(`Error generating thumbnail for resume ${resume.name}:`, err);
      return null;
    }
  };

  const normalizeContent = (content) => {
    return content
      .replace(/\s+/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, '')
      .replace(/<div><br\s*\/?><\/div>/gi, '')
      .replace(/<div>\s*<\/div>/gi, '')
      .trim();
  };

  const saveResume = async () => {
    if (!editorRef.current || !userId) {
      toast.error('Cannot save resume: Editor or user ID missing.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    let name = currentResumeName;
    if (!currentResumeId) {
      name = prompt('Enter resume name:', currentTemplate.Name || 'My Resume');
      if (name === null) {
        return;
      }
      name = name || currentTemplate.Name || 'My Resume';
    }

    let content = editorRef.current.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    tempDiv.querySelectorAll('meta, title').forEach((el) => el.remove());
    const rootDiv = document.createElement('div');
    rootDiv.className = 'resume-content';
    while (tempDiv.firstChild) {
      rootDiv.appendChild(tempDiv.firstChild);
    }

    let styleBlock = content.match(/<style>.*<\/style>/s)?.[0];
    if (!styleBlock) {
      styleBlock = `
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          .resume-content {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 850px;
            margin: 0 auto;
            padding: 30px;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            white-space: pre-line;
            background-color: #1e3a8a;
            color: white;
          }
          .name {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .contact-info {
            font-size: 14px;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #999;
            padding-bottom: 5px;
          }
          .experience-item, .education-item, .job, .project-item {
            margin-bottom: 15px;
          }
          .title-row, .job-title, .degree, .project-title {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .company, .degree, .school {
            font-style: italic;
          }
          .description, .job-description, .edu-description, .project-description {
            margin-top: 5px;
          }
          .skills-list, .languages-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            list-style-type: none;
          }
          .skill {
            background-color: #f0f0f0;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 14px;
          }
          ul {
            list-style-type: disc;
            margin-left: 15px;
          }
        </style>
      `;
    }
  
    content = `${styleBlock}${rootDiv.outerHTML}`;
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/on\w+="[^"]*"/gi, '');
  
    if (!name.trim() || !content.trim()) {
      toast.error('Resume name and content cannot be empty.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    const resumeData = {
      userId: parseInt(userId),
      templateId: currentTemplate.id,
      name,
      content,
    };
  
    try {
      console.log('Saving content:', content.substring(0, 500) + '...');
      let response;
      if (currentResumeId) {
        response = await axios.put(`${API_BASE_URL}/api/Resumes/${currentResumeId}`, resumeData, {
          headers,
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/api/Resumes`, resumeData, { headers });
      }
  
      const updatedResume = {
        resumeId: response.data.resumeId || currentResumeId,
        userId: parseInt(userId),
        templateId: currentTemplate.id,
        name,
        content,
        ThumbnailUrl: await generateResumeThumbnail({ content, name }),
      };
  
      setSavedResumes((prev) => {
        const filtered = prev.filter((resume) => resume.resumeId !== updatedResume.resumeId);
        return [...filtered, updatedResume];
      });
  
      setCurrentResumeId(updatedResume.resumeId);
      setCurrentResumeName(name);
      setEditedContent(content);
  
      await fetchSavedResumes();
      toast.success('Resume saved successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error saving resume:', err.response?.data || err);
      toast.error(
        err.response?.data?.message || 'Failed to save resume. Please check your input and try again.',
        {
          position: 'top-right',
          autoClose: 3000,
        }
      );
    }
  };

  const deleteResume = async (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/Resumes/${resumeId}`, { headers });
        setSavedResumes((prev) => prev.filter((r) => r.resumeId !== resumeId));
        await fetchSavedResumes();
        toast.success('Resume deleted successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } catch (err) {
        console.error('Error deleting resume:', err);
        toast.error('Failed to delete resume.', {
          position: 'top-right',
          autoClose: 3000,
        });
        await fetchSavedResumes();
      }
    }
  };

  const handlePreview = (item, isResume = false) => {
    setPreviewTemplate({ ...item, isResume });
    setShowPreview(true);
  };

  const handleEdit = (template, fromSavedResume = false) => {
    let contentToEdit = template.Content || '';
    let resumeId = null;
    let resumeName = null;

    if (fromSavedResume) {
      const savedResume = savedResumes.find(
        (resume) => resume.templateId === template.id && resume.resumeId === fromSavedResume.resumeId
      );
      if (savedResume) {
        contentToEdit = savedResume.content;
        resumeId = savedResume.resumeId;
        resumeName = savedResume.name;
      }
    }

    if (!contentToEdit) {
      contentToEdit = '<div class="resume-content"><h1>Your Resume</h1><p>Start editing your resume here...</p></div>';
    }

    setCurrentTemplate(template);
    setCurrentResumeId(resumeId);
    setCurrentResumeName(resumeName);
    setEditedContent(contentToEdit);
    setShowEditor(true);
    if (typeof onTemplateSelect === 'function') {
      onTemplateSelect(template.id);
    }
  };

  const handleEditSavedResume = (resume) => {
    const template = templates.find((t) => t.id === resume.templateId);
    if (template) {
      handleEdit(template, resume);
    } else {
      alert('Associated template not found.');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewTemplate(null);
  };

  const closeEditor = () => {
    if (editorRef.current) {
      const currentContent = normalizeContent(editorRef.current.innerHTML);
      const savedContent = normalizeContent(editedContent);
      if (currentContent !== savedContent) {
        if (window.confirm('You have unsaved changes. Save before closing?')) {
          saveResume();
        }
      }
    }
    setShowEditor(false);
    setCurrentTemplate(null);
    setCurrentResumeId(null);
    setCurrentResumeName(null);
    setEditedContent('');
  };

  const downloadAsPDF = async () => {
    if (!editorRef.current) return;

    try {
      setExporting(true);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const margin = 10;
      const pageWidth = 210 - 2 * margin;
      const pageHeight = 297 - 2 * margin;

      const content = editorRef.current;
      const contentClone = content.cloneNode(true);

      contentClone.style.width = `${pageWidth}mm`;
      contentClone.style.padding = '0';
      contentClone.style.margin = '0';
      contentClone.style.boxSizing = 'border-box';
      contentClone.style.fontSize = '12pt';
      contentClone.style.fontFamily = 'Arial, sans-serif';
      contentClone.style.position = 'absolute';
      contentClone.style.left = '-9999px';
      contentClone.style.top = '-9999px';
      contentClone.style.border = 'none';

      const images = contentClone.querySelectorAll('img');
      images.forEach((img) => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      });
      const tables = contentClone.querySelectorAll('table');
      tables.forEach((table) => {
        table.style.width = '100%';
        table.style.tableLayout = 'fixed';
      });

      document.body.appendChild(contentClone);

      const canvas = await html2canvas(contentClone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: contentClone.offsetWidth,
        height: contentClone.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgWidth = pageWidth;
      const imgHeightPx = canvas.height;
      const pxToMm = (px) => (px * 25.4 / (96 * 2));
      const imgHeightMm = pxToMm(imgHeightPx);
      const pageHeightPx = (pageHeight / 25.4) * 96 * 2;

      let totalPages = Math.ceil(imgHeightMm / pageHeight);
      let currentPositionPx = 0;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const canvasForPage = document.createElement('canvas');
        canvasForPage.width = canvas.width;
        canvasForPage.height = Math.min(pageHeightPx, imgHeightPx - currentPositionPx);

        const ctx = canvasForPage.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          currentPositionPx,
          canvas.width,
          canvasForPage.height,
          0,
          0,
          canvasForPage.width,
          canvasForPage.height
        );

        const pageImgData = canvasForPage.toDataURL('image/jpeg', 1.0);
        const pageImgHeightMm = pxToMm(canvasForPage.height);

        pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, pageImgHeightMm);

        currentPositionPx += pageHeightPx;
      }

      document.body.removeChild(contentClone);
      pdf.save(`${currentTemplate.Name || 'resume'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range) => {
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleResumeSearchChange = (e) => {
    setResumeSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter((template) =>
        template.Name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchTerm, templates]);

  useEffect(() => {
    if (resumeSearchTerm === '') {
      setFilteredResumes(savedResumes);
    } else {
      const filtered = savedResumes.filter((resume) =>
        resume.name.toLowerCase().includes(resumeSearchTerm.toLowerCase())
      );
      setFilteredResumes(filtered);
    }
  }, [resumeSearchTerm, savedResumes]);

  useEffect(() => {
    if (showEditor && editorRef.current && editorRef.current.innerHTML !== editedContent) {
      const savedRange = saveSelection();
      editorRef.current.innerHTML = editedContent;
      restoreSelection(savedRange);
      editorRef.current.focus();
    }
  }, [showEditor, editedContent]);

  useEffect(() => {
    const editor = editorRef.current;
    if (showEditor && editor) {
      let inputTimeout;

      const handleInput = () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
          setEditedContent(editor.innerHTML);
        }, 500);
      };

      const handleFormatting = () => {
        setActiveTools({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
        });
      };

      editor.addEventListener('input', handleInput);
      editor.addEventListener('mouseup', handleFormatting);
      editor.addEventListener('keyup', handleFormatting);

      return () => {
        if (editor) {
          clearTimeout(inputTimeout);
          editor.removeEventListener('input', handleInput);
          editor.removeEventListener('mouseup', handleFormatting);
          editor.removeEventListener('keyup', handleFormatting);
        }
      };
    }
  }, [showEditor]);

  const handleTemplatePreviousPage = () => {
    if (templateCurrentPage > 1) {
      setTemplateCurrentPage(templateCurrentPage - 1);
      setTemplatePageInput(templateCurrentPage - 1);
    }
  };

  const handleTemplateNextPage = () => {
    if (templateCurrentPage < templateTotalPages) {
      setTemplateCurrentPage(templateCurrentPage + 1);
      setTemplatePageInput(templateCurrentPage + 1);
    }
  };

  const handleTemplatePageInputChange = (e) => setTemplatePageInput(e.target.value);

  const handleTemplatePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(templatePageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > templateTotalPages) {
      toast.error(`The maximum number of pages is ${templateTotalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTemplatePageInput(templateCurrentPage);
    } else {
      setTemplateCurrentPage(pageNum);
      setTemplatePageInput(pageNum);
    }
  };

  const handleResumePreviousPage = () => {
    if (resumeCurrentPage > 1) {
      setResumeCurrentPage(resumeCurrentPage - 1);
      setResumePageInput(resumeCurrentPage - 1);
    }
  };

  const handleResumeNextPage = () => {
    if (resumeCurrentPage < resumeTotalPages) {
      setResumeCurrentPage(resumeCurrentPage + 1);
      setResumePageInput(resumeCurrentPage + 1);
    }
  };

  const handleResumePageInputChange = (e) => setResumePageInput(e.target.value);

  const handleResumePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(resumePageInput, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > resumeTotalPages) {
      toast.error(`The maximum number of pages is ${resumeTotalPages}.`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setResumePageInput(resumeCurrentPage);
    } else {
      setResumeCurrentPage(pageNum);
      setResumePageInput(pageNum);
    }
  };

  const { ref: tipsRef, inView: tipsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  if (authLoading) {
    return <div className="py-12 px-4 text-center">Loading...</div>;
  }

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={`placeholder-${index}`} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 h-64"></div>
              <div className="p-4 border-t">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="flex justify-between mt-3">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded mb-4 border border-red-200">
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchTemplates();
            fetchSavedResumes();
          }}
          className="mt-2 text-sm underline hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="py-0 m-0">
      <ToastContainer />
      <header className="bg-purple-900 text-purple-100 shadow-md p-4 m-0 sticky top-0 z-10">
        <div className="flex justify-center items-center h-8">
          <h1 className="text-2xl font-bold text-purple-100">User Dashboard</h1>
        </div>
        <button
          onClick={logout}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-purple-300 px-4 py-2 rounded-md shadow-md transition-all duration-300 hover:scale-105"
        >
          Logout
        </button>
      </header>

      <div className="mb-8 px-4 pt-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-purple-800 mb-2">Welcome back!</h2>
          <p className="text-gray-600 mb-4">
            Choose a template or view your saved resumes to start building.
          </p>
          <div className="flex space-x-4">
            <div className="bg-white px-4 py-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500">Templates Available</p>
              <p className="text-lg font-semibold text-purple-900">{totalTemplates}</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-md shadow-sm">
              <p className="text-xs text-gray-500">Saved Resumes</p>
              <p className="text-lg font-semibold text-purple-900">{totalResumes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'templates'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'resumes'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('resumes')}
          >
            My Resumes
          </button>
        </div>
      </div>

      {activeTab === 'templates' && (
        <>
          <div className="mb-6 px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full py-3 px-4 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                {searchTerm ? 'No templates match your search.' : 'No templates available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`group relative border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 ring-2 ring-blue-300 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300'
                  } transform hover:-translate-y-2`}
                  onClick={() => handlePreview(template)}
                >
                  <div
                    className="relative bg-gray-50 overflow-hidden"
                    style={{ width: '100%', height: '300px' }}
                  >
                    {thumbnailStates[template.id] === 'loading' ? (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : thumbnailStates[template.id] === 'error' ? (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-5xl font-bold text-gray-300">
                          {template.Name.charAt(0)}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={
                          template.ThumbnailUrl ||
                          `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E${template.Name}%3C/text%3E%3C/svg%3E`
                        }
                        alt={`${template.Name} template preview`}
                        className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E${template.Name}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold text-center px-4">
                        Click to View
                      </span>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t bg-white">
                    <h3 className="font-semibold text-base truncate">{template.Name}</h3>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                        className="px-4 py-1 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transform transition-all duration-150 hover:scale-105 active:scale-95 active:bg-green-800"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {templateTotalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2 px-4">
              <button
                onClick={handleTemplatePreviousPage}
                disabled={templateCurrentPage === 1}
                className={`p-1 rounded ${
                  templateCurrentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <form onSubmit={handleTemplatePageSubmit} className="flex items-center">
                <span className="text-gray-700 font-medium">Page</span>
                <input
                  type="number"
                  value={templatePageInput}
                  onChange={handleTemplatePageInputChange}
                  className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                  min="1"
                />
                <span className="text-gray-700 font-medium">of {templateTotalPages}</span>
              </form>
              <button
                onClick={handleTemplateNextPage}
                disabled={templateCurrentPage === templateTotalPages}
                className={`p-1 rounded ${
                  templateCurrentPage === templateTotalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'resumes' && (
        <div className="px-4">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resumes..."
                className="w-full py-3 px-4 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={resumeSearchTerm}
                onChange={handleResumeSearchChange}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {resumeError ? (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4 border border-red-200">
              <p>{resumeError}</p>
              <button
                onClick={() => {
                  setResumeError(null);
                  fetchSavedResumes();
                }}
                className="mt-2 text-sm underline hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500">
                {resumeSearchTerm ? 'No resumes match your search.' : 'No saved resumes yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredResumes.map((resume) => (
                <div
                  key={resume.resumeId}
                  className="group relative border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-gray-200 hover:border-blue-300 transform hover:-translate-y-2"
                  onClick={() => handlePreview(resume, true)}
                >
                  <div
                    className="relative bg-gray-50 overflow-hidden"
                    style={{ width: '100%', height: '300px' }}
                  >
                    {resume.ThumbnailUrl ? (
                      <img
                        src={resume.ThumbnailUrl}
                        alt={`${resume.name} preview`}
                        className="absolute top-0 left-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3E${resume.name}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-5xl font-bold text-gray-300">
                          {resume.name.charAt(0)}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold text-center px-4">
                        Click to View
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-white">
                    <h3 className="font-semibold text-base truncate">{resume.name}</h3>
                    <div className="mt-3 flex justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSavedResume(resume);
                        }}
                        className="px-4 py-1 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transform transition-all duration-150 hover:scale-105 active:scale-95 active:bg-green-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResume(resume.resumeId);
                        }}
                        className="px-4 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transform transition-all duration-150 hover:scale-105 active:scale-95 active:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {resumeTotalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={handleResumePreviousPage}
                disabled={resumeCurrentPage === 1}
                className={`p-1 rounded ${
                  resumeCurrentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <form onSubmit={handleResumePageSubmit} className="flex items-center">
                <span className="text-gray-700 font-medium">Page</span>
                <input
                  type="number"
                  value={resumePageInput}
                  onChange={handleResumePageInputChange}
                  className="w-16 mx-2 p-1 border border-gray-300 rounded text-center"
                  min="1"
                />
                <span className="text-gray-700 font-medium">of {resumeTotalPages}</span>
              </form>
              <button
                onClick={handleResumeNextPage}
                disabled={resumeCurrentPage === resumeTotalPages}
                className={`p-1 rounded ${
                  resumeCurrentPage === resumeTotalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300 hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
{showPreview && previewTemplate && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-backdropFadeIn">
    <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-modalFadeIn">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold text-lg">
          {previewTemplate.isResume ? previewTemplate.name : previewTemplate.Name} Preview
        </h3>
        <button onClick={closePreview} className="text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {(previewTemplate.Content || previewTemplate.content) ? (
          <div
            className="template-preview"
            style={{
              width: '210mm',
              margin: '0 auto',
              padding: '15mm',
              backgroundColor: 'white',
              boxShadow: '0 0 15px rgba(0,0,0,0.1)',
              overflow: 'hidden', // Prevent any inner scrollbar
            }}
          >
            <iframe
              style={{
                width: '100%',
                border: 'none',
                display: 'block',
                minHeight: '500px',
                overflow: 'hidden', // Explicitly disable iframe scrollbar
              }}
              ref={(iframe) => {
                if (iframe) {
                  const doc = iframe.contentDocument || iframe.contentWindow.document;
                  let content = previewTemplate.isResume ? previewTemplate.content : previewTemplate.Content;
                  let styleBlock = content.match(/<style>.*<\/style>/s)?.[0] || `
                    <style>
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      .resume-content, .resume-container {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 850px;
                        margin: 0 auto;
                        padding: 30px;
                        background-color: white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                      }
                      .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        white-space: pre-line;
                        background-color: #1e3a8a;
                        color: white;
                      }
                      .name {
                        font-size: 26px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        text-transform: uppercase;
                      }
                      .contact-info {
                        font-size: 14px;
                        margin-bottom: 10px;
                      }
                      .section {
                        margin-bottom: 20px;
                      }
                      .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        border-bottom: 1px solid #999;
                        padding-bottom: 5px;
                      }
                      .experience-item, .education-item, .job, .project-item {
                        margin-bottom: 15px;
                      }
                      .title-row, .job-title, .degree, .project-title {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                      }
                      .company, .degree, .school {
                        font-style: italic;
                      }
                      .description, .job-description, .edu-description, .project-description {
                        margin-top: 5px;
                      }
                      .skills-list, .languages-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        list-style-type: none;
                      }
                      .skill {
                        background-color: #f0f0f0;
                        padding: 5px 10px;
                        border-radius: 3px;
                        font-size: 14px;
                      }
                      ul {
                        list-style-type: disc;
                        margin-left: 15px;
                      }
                      html, body {
                        height: auto !important;
                        overflow: hidden !important; /* Force no scrollbar */
                        margin: 0;
                        padding: 0;
                      }
                    </style>
                  `;

                  // Clean and wrap content
                  let cleanedContent = content
                    .replace(/<style>.*<\/style>/s, '')
                    .replace(/<meta[^>]*>/g, '')
                    .replace(/<title[^>]*>.*<\/title>/g, '');
                  
                  if (!cleanedContent.includes('class="resume-content"') && !cleanedContent.includes('class="resume-container"')) {
                    cleanedContent = `<div class="resume-content">${cleanedContent}</div>`;
                  }

                  doc.open();
                  doc.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        ${styleBlock}
                      </head>
                      <body>
                        ${cleanedContent}
                      </body>
                    </html>
                  `);
                  console.log(`Preview ${previewTemplate.isResume ? 'resume' : 'template'} ${previewTemplate.resumeId || previewTemplate.id}:`, doc.documentElement.outerHTML.substring(0, 500) + '...');
                  doc.close();

                  // Dynamically adjust iframe height to content
                  const adjustIframeHeight = () => {
                    if (iframe.contentWindow && iframe.contentWindow.document.body) {
                      const contentHeight = iframe.contentWindow.document.body.scrollHeight;
                      const adjustedHeight = Math.max(contentHeight + 60, 500); // Add padding for safety
                      iframe.style.height = `${adjustedHeight}px`;
                    }
                  };

                  // Run adjustment after content loads
                  iframe.onload = () => {
                    adjustIframeHeight();
                    // Force re-render to ensure no scrollbar
                    iframe.style.overflow = 'hidden';
                  };
                  setTimeout(adjustIframeHeight, 200); // Increased delay for template content
                }
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Preview not available</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t flex justify-end space-x-4">
        <button
          onClick={closePreview}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
        <button
          onClick={() => {
            if (previewTemplate.isResume) {
              handleEditSavedResume(previewTemplate);
            } else {
              handleEdit(previewTemplate);
            }
            closePreview();
          }}
          className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          Edit
        </button>
      </div>
    </div>
  </div>
)}
      {showEditor && currentTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">
                Editing: {currentTemplate.Name} {currentResumeName ? `(${currentResumeName})` : ''}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={saveResume}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Save
                </button>
                <button
                  onClick={downloadAsPDF}
                  disabled={exporting}
                  className={`px-4 py-2 ${
                    exporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-md text-sm flex items-center`}
                >
                  {exporting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Exporting PDF...
                    </>
                  ) : (
                    'Download PDF'
                  )}
                </button>
                <button onClick={closeEditor} className="text-gray-500 hover:text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="p-2 border-r border-gray-200 bg-gray-50">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => document.execCommand('bold')}
                    className={`p-2 rounded transition-all duration-200 ${
                      activeTools.bold ? 'bg-purple-600 text-white' : 'hover:bg-gray-200'
                    }`}
                    title="Bold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.5 10a2.5 2.5 0 01-2.5 2.5H8v-5h3a2.5 2.5 0 012.5 2.5zM8 15h3.5a2.5 2.5 0 002.5-2.5 2.5 2.5 0 00-2.5-2.5H8v5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => document.execCommand('italic')}
                    className={`p-2 rounded transition-all duration-200 ${
                      activeTools.italic ? 'bg-purple-600 text-white' : 'hover:bg-gray-200'
                    }`}
                    title="Italic"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 5.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5h-1l-1.5 7h1a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-.5a.5.5 0 01.5-.5h1l1.5-7h-1a.5.5 0 01-.5-.5v-.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => document.execCommand('underline')}
                    className={`p-2 rounded transition-all duration-200 ${
                      activeTools.underline ? 'bg-purple-600 text-white' : 'hover:bg-gray-200'
                    }`}
                    title="Underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 3a1 1 0 011-1h8a1 1 0 011 1v7a4 4 0 01-8 0V3a1 1 0 00-2 0v7a6 6 0 0012 0V3a1 1 0 011-1h1a1 1 0 011 1v7a8 8 0 01-16 0V3a1 1 0 011-1h1z" />
                      <path d="M4 15h12a1 1 0 010 2H4a1 1 0 010-2z" />
                    </svg>
                  </button>
                  <div className="border-t border-gray-300 my-1"></div>
                  <button
                    onClick={() => {
                      const color = prompt('Enter color (e.g., #FF0000, red):');
                      if (color) document.execCommand('foreColor', false, color);
                    }}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Text Color"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 3a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1V5zm0 4a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1V9zm0 4a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const url = prompt('Enter image URL:');
                      if (url) document.execCommand('insertImage', false, url);
                    }}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Insert Image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className="border-t border-gray-300 my-1"></div>
                  <button
                    onClick={() => document.execCommand('justifyLeft')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Align Left"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => document.execCommand('justifyCenter')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Align Center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-2 4a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => document.execCommand('justifyRight')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Align Right"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h8a1 1 0 110 2h-8a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className="border-t border-gray-300 my-1"></div>
                  <button
                    onClick={() => document.execCommand('insertUnorderedList')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Bullet List"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M3 5a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm3-8h10a1 1 0 010 2H6a1 1 0 010-2zm0 4h10a1 1 0 010 2H6a1 1 0 010-2zm0 4h10a1 1 0 010 2H6a1 1 0 010-2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto bg-gray-50">
                <div
                  ref={editorRef}
                  className="resume-editor"
                  contentEditable
                  style={{
                    minHeight: '70vh',
                    width: '210mm',
                    margin: '0 auto',
                    padding: '15mm',
                    backgroundColor: 'white',
                    boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12pt',
                    lineHeight: '1.5',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={tipsRef}
        className={`mt-12 px-4 py-8 bg-gray-50 rounded-lg transition-all duration-700 transform ${
          tipsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Resume Writing Tips</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="text-purple-600 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Highlight Achievements</h4>
            <p className="text-gray-600 text-sm">
              Focus on your accomplishments rather than just job duties. Use numbers and percentages
              when possible.
            </p>
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="text-purple-600 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Tailor Your Resume</h4>
            <p className="text-gray-600 text-sm">
              Customize your resume for each job application to match the job description and
              highlight relevant skills.
            </p>
          </div>
          <div className="bg-white p-4 rounded-md shadow-sm">
            <div className="text-purple-600 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">Keep It Concise</h4>
            <p className="text-gray-600 text-sm">
              Aim for a one-page resume unless you have extensive experience. Use bullet points and
              short paragraphs.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        button {
          transition: all 0.3s ease;
        }
        button:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

UserDashboard.propTypes = {
  selectedTemplate: PropTypes.string,
  onTemplateSelect: PropTypes.func.isRequired,
};

export default UserDashboard;