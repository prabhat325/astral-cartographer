import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { analyzeRepository, analyzeFiles, loadDemoAnalysis, slugToUrl } from '../api/apiClient';

const initialState = {
  status: 'idle',
  error: null,
  repoUrl: '',
  branch: 'main',
  result: null,
  selectedNode: null,
  selectedFilePath: null,
  activeView: 'home',
  searchQuery: '',
  graphMode: 'modules', // 'modules' | 'calls'
  sidebarOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_REPO_URL':
      return { ...state, repoUrl: action.payload };
    case 'SET_BRANCH':
      return { ...state, branch: action.payload };
    case 'ANALYSIS_START':
      return { ...state, status: 'loading', error: null, result: null, selectedNode: null };
    case 'ANALYSIS_SUCCESS':
      return { ...state, status: 'success', result: action.payload, activeView: 'overview', error: null };
    case 'ANALYSIS_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload };
    case 'SELECT_FILE_PATH':
      return { ...state, selectedFilePath: action.payload };
    case 'SET_VIEW':
      return {
        ...state,
        activeView: action.payload,
        graphMode: action.payload === 'callGraph' ? 'calls' : action.payload === 'dependency' ? 'modules' : state.graphMode,
        sidebarOpen: false, // Close on mobile navigation
      };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_GRAPH_MODE':
      return { ...state, graphMode: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const runAnalysis = useCallback(async (slug) => {
    const url = slugToUrl(slug);
    dispatch({ type: 'ANALYSIS_START' });
    try {
      const data = await analyzeRepository(url);
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'ANALYSIS_ERROR', payload: err.message || 'Analysis failed. Check your network or GitHub token.' });
    }
  }, []);

  const runFileAnalysis = useCallback(async (files) => {
    dispatch({ type: 'ANALYSIS_START' });
    try {
      const arch = await analyzeFiles(files);
      dispatch({
        type: 'ANALYSIS_SUCCESS',
        payload: {
          repository: { name: 'Local Workspace Files', fullName: 'workspace/uploaded', description: 'In-memory AST file analysis' },
          totalFiles: files.length,
          files,
          architecture: arch,
        },
      });
    } catch (err) {
      dispatch({ type: 'ANALYSIS_ERROR', payload: err.message });
    }
  }, []);

  const loadDemo = useCallback(async () => {
    dispatch({ type: 'ANALYSIS_START' });
    try {
      const data = await loadDemoAnalysis();
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'ANALYSIS_ERROR', payload: err.message });
    }
  }, []);

  const selectNode           = useCallback((node) => dispatch({ type: 'SELECT_NODE', payload: node }), []);
  const setSelectedFilePath  = useCallback((path) => dispatch({ type: 'SELECT_FILE_PATH', payload: path }), []);
  const setView              = useCallback((view) => dispatch({ type: 'SET_VIEW', payload: view }), []);
  const setSearch            = useCallback((q)    => dispatch({ type: 'SET_SEARCH', payload: q }), []);
  const setRepoUrl           = useCallback((url)  => dispatch({ type: 'SET_REPO_URL', payload: url }), []);
  const setBranch            = useCallback((br)   => dispatch({ type: 'SET_BRANCH', payload: br }), []);
  const setGraphMode         = useCallback((mode) => dispatch({ type: 'SET_GRAPH_MODE', payload: mode }), []);
  const toggleSidebar        = useCallback(()     => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);
  const setSidebarOpen       = useCallback((open) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }), []);
  const reset                = useCallback(()     => dispatch({ type: 'RESET' }), []);

  const navigateToCodeExplorer = useCallback((filePath) => {
    dispatch({ type: 'SELECT_FILE_PATH', payload: filePath });
    dispatch({ type: 'SET_VIEW', payload: 'codeExplorer' });
  }, []);

  const navigateToGraph = useCallback((node, mode = 'modules') => {
    dispatch({ type: 'SET_GRAPH_MODE', payload: mode });
    dispatch({ type: 'SELECT_NODE', payload: node });
    dispatch({ type: 'SET_VIEW', payload: mode === 'calls' ? 'callGraph' : 'dependency' });
  }, []);

  return (
    <AnalysisContext.Provider value={{
      state,
      runAnalysis,
      runFileAnalysis,
      loadDemo,
      selectNode,
      setSelectedFilePath,
      setView,
      setSearch,
      setRepoUrl,
      setBranch,
      setGraphMode,
      toggleSidebar,
      setSidebarOpen,
      navigateToCodeExplorer,
      navigateToGraph,
      reset,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within an AnalysisProvider');
  return ctx;
}
