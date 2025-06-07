import { useState, useEffect, useCallback } from 'react';
import api from "@/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants"


export const useHospitalData = () => {
  const [users, setUsers] = useState([]); //Admin and Agent
  const [agents, setAgents] = useState([]);
  const [context, setContext] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  {/* Get Objects */}

  // Get Agents
  /* 
    // Beispiel 1: Alle Agents laden
    const data = await getAgents();

    // Beispiel 2: Nach Name und Zugang filtern
    const data = await getAgents({
    name: "Smith",
    min_access_level: 3,
    ordering: "-access_level",}); 
  */
  const getAgents = async (filters = {}) => {
    try {
        // Axios verarbeitet das für dich: Du übergibst die Filter direkt über params
        const response = await api.get("/api/agents/", {
        params: filters,
        });

        return response.data; // enthält z. B. { results: [...], count: ..., next: ..., previous: ... }
    } catch (error) {
        const message = error.response?.data?.detail || "Error fetching agents";
        console.error("Error fetching agents:", message);
        throw new Error(message);
    }
  };

  // get Contexts
  const getContexts = async (filters = {}) => {
    try {
        // Axios verarbeitet das für dich: Du übergibst die Filter direkt über params
        const response = await api.get("api/contexts/", {
        params: filters,
        });

        return response.data; // enthält z. B. { results: [...], count: ..., next: ..., previous: ... }
    } catch (error) {
        const message = error.response?.data?.detail || "Error fetching contexts";
        console.error("Error fetching Contexts:", message);
        throw new Error(message);
    }
  };

  // get Spaces
  const getSpaces = async (filters = {}) => {
    try {
        const response = await api.get("api/spaces/", {
        params: filters,
        });

        return response.data; // enthält z. B. { results: [...], count: ..., next: ..., previous: ... }
    } catch (error) {
        const message = error.response?.data?.detail || "Error fetching spaces";
        console.error("Error fetching spaces:", message);
        throw new Error(message);
    }
  };

    /* Create Objects */

  // Create User & Agent
  const createAgent = async (payload) => {
    try {
        const response = await api.post("/api/auth/user/register/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.message || "Error occured when creating the Agent.";
        throw new Error(message); 
      }
  };

  // Create Context
  const createContext = async (payload) => {
    try {
        const response = await api.post("api/contexts/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.message || "Error occured when creating the Context.";
        throw new Error(message); 
      }
  };

  // Create Space
  const createSpace = async (payload) => {
    try {
      const response = await api.post("api/spaces/", payload);
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || "Error occured when creating the Space.";
      throw new Error(message); 
    }
  };


  {/* Delete Objects*/}
  // TODO: delete AgentUser as well!!
  const deleteAgent = async (agentId) => {
    try {
      const response = await api.delete(`/api/agents/${agentId}/`);
      console.log("Agent deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting agent:", error);
      const message = error.response?.data?.message || "Error occured when deleting the Agent.";
      throw new Error(message)
    }
  };

  // TODO: Delete Context (nicht in api call text??)
  const deleteContext = async (contextId) => {
    try {
      const response = await api.delete(`/api/contexts/${contextId}/`);
      console.log("context deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting context:", error);
      const message = error.response?.data?.message || "Error occured when deleting the context.";
      throw new Error(message)
    }
  };

  // TODO: Delete Space (nicht in api call text??)
  const deleteSpace = async (spaceId) => {
    try {
      const response = await api.delete(`/api/spaces/${spaceId}/`);
      console.log("Space deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting space:", error);
      const message = error.response?.data?.message || "Error occured when deleting the space.";
      throw new Error(message)
    }
  };

  {/* Update Objects */}

  // Update Agent
  /*
  For a partial update (e.g., just access_level):

    await updateAgent(42, { access_level: 7 });
    // Sends PATCH /api/agents/42/

  For a full update (e.g., all fields):

    await updateAgent(42, {
    name: "Dr. Smith Updated",
    access_level: 6
    }, false);
    // Sends PUT /api/agents/42/
  */
  const updateAgent = async (agentId, updatedData, isPartial = true) => {
    try {
      const method = isPartial ? "patch" : "put";
      const response = await api[method](`/agents/${agentId}/`, updatedData);
  
      console.log("Agent updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating agent:", error);
      const message = error.response?.data?.message || "Error occured when deleting the space.";
      throw new Error(message); 
    }
  };

  // TODO: Update Context -> only add/ remove Agent from Context
  // TODO: Update Space ??





  return {
    getAgents,
    getContexts,
    getSpaces,
    createAgent,
    createContext,
    createSpace,
    deleteAgent,
    deleteContext,
    deleteSpace,
    updateAgent,
  };
}




  /*const getAgents = async (filters = {}) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
  
      const params = new URLSearchParams();
  
      // Filteroptionen dynamisch hinzufügen
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value !== undefined && value !== null && value !== "") {
          params.append(key, value);
        }
      }
  
      const url = `/api/agents/?${params.toString()}`;
  
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch agents");
      }
  
      const data = await response.json();
      return data; // enthält normalerweise { results: [...], count: ..., next: ..., previous: ... }
    } catch (err) {
      console.error("Error fetching agents:", err);
      throw err;
    }
  };
  
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, objectsRes, relationshipsRes] = await Promise.all([
        axios.get(`${API_BASE}/users/`),
        axios.get(`${API_BASE}/objects/`),
        axios.get(`${API_BASE}/relationships/`)
      ]);
      setUsers(usersRes.data);
      setObjects(objectsRes.data);
      setRelationships(relationshipsRes.data);
    } catch (err) {
      console.error('Fehler beim Laden der Daten:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Optional: Methoden zum Erstellen/Löschen
  const createObject = async (objectData) => {
    const response = await axios.post(`${API_BASE}/objects/`, objectData);
    setObjects(prev => [...prev, response.data]);
    return response.data;
  };

  const deleteObject = async (id) => {
    await axios.delete(`${API_BASE}/objects/${id}/`);
    setObjects(prev => prev.filter(o => o.id !== id));
    setRelationships(prev => prev.filter(rel =>
      rel.fromObjectId !== id && rel.toObjectId !== id
    ));
  };

  const createRelationship = async (data) => {
    const response = await axios.post(`${API_BASE}/relationships/`, data);
    setRelationships(prev => [...prev, response.data]);
    return response.data;
  };

  const deleteRelationship = async (id) => {
    await axios.delete(`${API_BASE}/relationships/${id}/`);
    setRelationships(prev => prev.filter(rel => rel.id !== id));
  };

  return {
    users,
    objects,
    relationships,
    loading,
    error,
    refetch: fetchData,
    createObject,
    deleteObject,
    createRelationship,
    deleteRelationship
  };
};
*/