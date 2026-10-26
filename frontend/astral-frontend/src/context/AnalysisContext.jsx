import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { analyzeRepository, analyzeFiles, loadDemoAnalysis, slugToUrl } from '../api/apiClient';

/* ────────────────────────────────────────────────────
   SHAPE:
   {
     status: 'idle' | 'loading' | 'success' | 'error',
     error: string | null,
     repoUrl: string,
     result: {
       repository: { name, fullName, description },
       totalFiles: number,
       files: [{path, content}],
       architecture: {
         summary: { totalFiles, totalEdges, ... healthScore },
         nodes: [...],
         edges: [...],
         callEdges: [...],
         circularCycles: [...],
         hotspots: [...],
         onboarding: [...],
         symbols: [...],
         functionCalls: [...],
         errors: [...],
       }
     } | null,
     selectedNode: node | null,
     activeView: 'overview' | 'dependency' | 'codeExplorer' | 'health',
     searchQuery: string,
   }
────────────────────────────────────────────────────── */

const initialState = {
  status: 'idle',
  error: null,
  repoUrl: '',
  result: null,
  selectedNode: null,
  activeView: 'home',
  searchQuery: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_REPO_URL':
      return { ...state, repoUrl: action.payload };
    case 'ANALYSIS_START':
      return { ...state, status: 'loading', error: null, result: null, selectedNode: null };
    case 'ANALYSIS_SUCCESS':
      return { ...state, status: 'success', result: action.payload, activeView: 'overview' };
    case 'ANALYSIS_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload };
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
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
      dispatch({ type: 'ANALYSIS_ERROR', payload: err.message });
    }
  }, []);

  const runFileAnalysis = useCallback(async (files) => {
    dispatch({ type: 'ANALYSIS_START' });
    try {
      const arch = await analyzeFiles(files);
      dispatch({
        type: 'ANALYSIS_SUCCESS',
        payload: {
          repository: { name: 'Local Files', fullName: 'local/files', description: 'Uploaded files' },
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

  const selectNode   = useCallback((node) => dispatch({ type: 'SELECT_NODE', payload: node }), []);
  const setView      = useCallback((view) => dispatch({ type: 'SET_VIEW', payload: view }), []);
  const setSearch    = useCallback((q)    => dispatch({ type: 'SET_SEARCH', payload: q }), []);
  const setRepoUrl   = useCallback((url)  => dispatch({ type: 'SET_REPO_URL', payload: url }), []);
  const reset        = useCallback(()     => dispatch({ type: 'RESET' }), []);

  return (
    <AnalysisContext.Provider value={{
      state, runAnalysis, runFileAnalysis, loadDemo, selectNode, setView, setSearch, setRepoUrl, reset,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be inside AnalysisProvider');
  return ctx;
}
