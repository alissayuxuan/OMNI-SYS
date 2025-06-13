import { useState, useEffect, useCallback } from 'react';
import api from "@/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants"


export const manageHospitalData = () => {
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

  const getAllAgents = async (filters = {}) => {
    try {
      const response = await api.get("/api/agents/get_queryset_all/", {
        params: filters,
      });
      return response.data;
    } catch (error) {
    const message = error.response?.data?.detail || "Error fetching all agents";
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

const getAllContexts = async (filters = {}) => {
  try {
    const response = await api.get("/api/contexts/get_queryset_all/", {
      params: filters,
    });
    return response.data; // enthält z. B. { results: [...], count: ..., next: ..., previous: ... }
  } catch (error) {
    const message = error.response?.data?.detail || "Error fetching all contexts";
    console.error("Error fetching all contexts:", message);
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

  const getAllSpaces = async () => {
  try {
    const response = await api.get("/api/spaces/get_queryset_all/", {
      params: filters
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || "Error fetching all spaces";
    throw new Error(message);
  }
};

  // Get all users (optional: filter by role)
  const getUsers = async (role = null) => {
    try {
      const response = await api.get(`api/auth/users/${role ? `?role=${role}` : ''}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to fetch users.";
      throw new Error(message);
    }
  };
  
  // Get a specific user by ID
  const getUser = async (userId) => {
    try {
      const response = await api.get(`api/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to fetch user.";
      throw new Error(message);
    }
  };

  // Get AgentProfiles (agent from authentification table)
  const getAgentProfiles = async () => {
    try {
      const res = await api.get("api/auth/agent-profiles/");
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to fetch agent profiles");
    }
  };
  
  // Get specific AgentProfiles (agent from authentification table)
  const getAgentProfile = async (id) => {
    try {
      const res = await api.get(`api/auth/agent-profiles/${id}/`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to fetch agent profile");
    }
  };

  // Get AdminProfiles
  const getAdminProfiles = async () => {
    try {
      const res = await api.get("api/auth/admin-profiles/");
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to fetch admin profiles");
    }
  };
  
  // Get specific AdminProfile
  const getAdminProfile = async (id) => {
    try {
      const res = await api.get(`api/auth/admin-profiles/${id}/`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to fetch admin profile");
    }
  };

  /* Create Objects */

  // Create User & Agent
  const createAgent = async (payload) => {
    console.log("create agent: ", payload)
    try {
        const response = await api.post("/api/auth/user/register/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.message || "Error occured when creating the Agent.";
        throw new Error(message); 
      }
  };

  // Create Admin
  const createAdmin = async (payload) => {
    console.log("create admin: ", payload)
    try {
        const response = await api.post("/api/auth/user/register/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.message || "Error occured when creating the Admin.";
        throw new Error(message); 
      }
  };

  // Create Context
  const createContext = async (payload) => {
    console.log("payload manageHospitalData: \n", payload)
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
    console.log("createSpace - ", payload)
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
    console.log("DELETE AGENT: ", agentId)
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
  
  // Delete a user by ID
  const deleteUser = async (userId) => {
    try {
      await api.delete(`api/auth/users/${userId}/`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to delete user.";
      throw new Error(message);
    }
  };

  // Delete AgentProfile
  const deleteAgentProfile = async (id) => {
    try {
      await api.delete(`api/auth/agent-profiles/${id}/`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to delete agent profile");
    }
  };

  // Delete AdminProfile
  const deleteAdminProfile = async (id) => {
    try {
      await api.delete(`api/auth/admin-profiles/${id}/`);
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to delete admin profile");
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
      const response = await api[method](`/api/agents/${agentId}/`, updatedData);
  
      console.log("Agent updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating agent:", error);
      const message = error.response?.data?.message || "Error occured when deleting the space.";
      throw new Error(message); 
    }
  };

  // Update Context
  const updateContext = async (contextId, updatedData, isPartial = true) => {
    try {
      const method = isPartial ? "patch" : "put";
      const res = await api[method](`/api/contexts/${contextId}/`, updatedData);
      console.log("Context updated successfully:", res.data);
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})?.[0]?.[0] ||
        "Failed to update context";
      console.error("Error updating context:", msg);
      throw new Error(msg);
    }
  };

  // Update Space
  const updateSpace = async (spaceId, updatedData, isPartial = true) => {
    try {
      const method = isPartial ? "patch" : "put";
      const res = await api[method](`/api/spaces/${spaceId}/`, updatedData);
      console.log("Space updated successfully:", res.data);
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})?.[0]?.[0] ||
        "Failed to update space";
      console.error("Error updating space:", msg);
      throw new Error(msg);
    }
  };

  // Update a user by ID
 const updateUser = async (userId, payload) => {
    try {
      const response = await api.put(`api/auth/users/${userId}/`, payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to update user.";
      throw new Error(message);
    }
  };

  // Update AgentProfile by ID
  const updateAgentProfile = async (id, data) => {
    try {
      const res = await api.put(`api/auth/agent-profiles/${id}/`, data);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to update agent profile");
    }
  };

  // Update AdminProfile by ID
  const updateAdminProfile = async (id, data) => {
    try {
      const res = await api.put(`api/auth/admin-profiles/${id}/`, data);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to update admin profile");
    }
  };


  const getProfile = async () => {
    try {
      const res = await api.get(`api/auth/profile/`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || "Failed to fetch agent profile");
    }
  }

  /*Beispiel:
  {
    username: "new_username",
    first_name: "Alissa",
    last_name: "Wang",
    email: "new@example.com"
  }
*/
  const updateProfile = async (updatedData) => {
    try {
      const res = await api.put(`api/auth/profile/`, updatedData);
      console.log("Profile updated successfully:", res.data);
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})?.[0]?.[0] ||
        "Failed to update profile";
      console.error("Error updating profile:", msg);
      throw new Error(msg);
    }
  };


  /* Beispiel:
  await changePassword({
    currentPassword: "oldpass123",
    newPassword: "securePass456",
  });
  */
  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const res = await api.post(`api/auth/change-password/`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return res.data;
    } catch (error) {
      const msg =
        error.response?.data?.current_password?.[0] ||
        error.response?.data?.new_password?.[0] ||
        error.response?.data?.detail ||
        "Failed to change password";
      throw new Error(msg);
    }
  };

   /* Archive and Unarchive Objects */

    const archive = async (model, id) => {
        try {
            const response = await api.post(`/api/${model}/${id}/archive/`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.detail || `Error archiving ${model}`;
            throw new Error(message);
        }
    };

    const unarchive = async (model, id) => {
        try {
            const response = await api.post(`/api/${model}/${id}/unarchive/`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.detail || `Error unarchiving ${model}`;
            throw new Error(message);
        }
    };

  return {
    getProfile,
    getAgents,
    getAllAgents,
    getContexts,
    getAllContexts,
    getSpaces,
    getAllSpaces,
    getUsers,
    getUser,
    getAgentProfiles,
    getAgentProfile,
    getAdminProfiles,
    getAdminProfile,
    createAgent,
    createAdmin,
    createContext,
    createSpace,
    deleteAgent,
    deleteContext,
    deleteSpace,
    updateAgent,
    archive,
    unarchive,
    updateContext,
    updateSpace,
    updateProfile,
    changePassword
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