/**
 * manageHospitalData – React Hook for a central administration of all api-calls concerning the 
 * hospital system (agents, contexts, spaces, relationships and admins).
 * 
 * Provided methods:
 * - fetch 
 * - create
 * - update 
 * - delete 
 * - archiving and restoring 
 * - profile administration and password changing
 * 
 * 
 * Example of usage:
 * const {
 *   getAgents, createContext, deleteUser, updateProfile
 * } = manageHospitalData();
 */


import api from "@/api";


export const manageHospitalData = () => {

  {/* Get Objects */}

  // Get Agents
  const getAgents = async (filters = {}) => {
    try {
        const response = await api.get("/api/agents/", {
        params: filters,
        });
        return response.data; 
    } catch (error) {
        const message = error.response?.data?.error || "Failed to fetch agents";
        throw new Error(message);
    }
  };

  // get Contexts
  const getContexts = async (filters = {}) => {
    try {
        const response = await api.get("api/contexts/", {
        params: filters,
        });
        return response.data; 
    } catch (error) {
        const message = error.response?.data?.error || "Failed to fetch contexts";
        throw new Error(message);
    }
  };

  // get Spaces
  const getSpaces = async (filters = {}) => {
    try {
        const response = await api.get("api/spaces/", {
        params: filters,
        });
        return response.data; 
    } catch (error) {
        const message = error.response?.data?.error || "Failed to fetch spaces";
        throw new Error(message);
    }
  };

  // Get all users (optional: filter by role)
  const getUsers = async (role = null) => {
    try {
      const response = await api.get(`api/auth/users/${role ? `?role=${role}` : ''}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch users.";
      throw new Error(message);
    }
  };
  
  // Get a specific user by ID
  const getUser = async (userId) => {
    try {
      const response = await api.get(`api/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch user.";
      throw new Error(message);
    }
  };

  // Get AgentProfiles (agent from authentification table)
  const getAgentProfiles = async () => {
    try {
      const res = await api.get("api/auth/agent-profiles/");
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch agent profiles");
    }
  };
  
  // Get specific AgentProfiles (agent from authentification table)
  const getAgentProfile = async (id) => {
    try {
      const res = await api.get(`api/auth/agent-profiles/${id}/`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch agent profile");
    }
  };

  // Get AdminProfiles
  const getAdminProfiles = async () => {
    try {
      const res = await api.get("api/auth/admin-profiles/");
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch admin profiles");
    }
  };
  
  // Get specific AdminProfile
  const getAdminProfile = async (id) => {
    try {
      const res = await api.get(`api/auth/admin-profiles/${id}/`);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch admin profile");
    }
  };

  // Get Relationships
  const getRelationships = async (params = {}) => {
    try {
      const response = await api.get('api/relationships/', { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to fetch relationships.";
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
        const message = error.response?.data?.error || "Error occured when creating the Agent.";
        throw new Error(message); 
      }
  };

  // Create Admin
  const createAdmin = async (payload) => {
    try {
        const response = await api.post("/api/auth/user/register/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.error || "Error occured when creating the Admin.";
        throw new Error(message); 
      }
  };

  // Create Context
  const createContext = async (payload) => {
    try {
        const response = await api.post("api/contexts/", payload);
        return response.data; 
      } catch (error) {
        const message = error.response?.data?.error || "Error occured when creating the Context.";
        throw new Error(message); 
      }
  };

  // Create Space
  const createSpace = async (payload) => {
    try {
      const response = await api.post("api/spaces/", payload);
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when creating the Space.";
      throw new Error(message); 
    }
  };

  // Create Relationship
  const createRelationship = async (payload) => {
    try {
      const response = await api.post('api/relationships/', payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when creating the Relationship.";
      throw new Error(message);
    }
  };



  {/* Delete Objects*/}
  const deleteAgent = async (agentId) => {
    try {
      const response = await api.delete(`/api/agents/${agentId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when deleting the Agent.";
      throw new Error(message)
    }
  };

  const deleteContext = async (contextId) => {
    try {
      const response = await api.delete(`/api/contexts/${contextId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when deleting the context.";
      throw new Error(message)
    }
  };

  const deleteSpace = async (spaceId) => {
    try {
      const response = await api.delete(`/api/spaces/${spaceId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when deleting the space.";
      throw new Error(message)
    }
  };

  // Delete Relationship
  const deleteRelationship = async (relationshipId) => {
    try {
      const response = await api.delete(`api/relationships/${relationshipId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when deleting the relationship.";      
      throw new Error(message);
    }
  };
  
  // Delete a user by ID
  const deleteUser = async (userId) => {
    try {
      await api.delete(`api/auth/users/${userId}/`);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to delete user.";
      throw new Error(message);
    }
  };

  // Delete AgentProfile
  const deleteAgentProfile = async (id) => {
    try {
      await api.delete(`api/auth/agent-profiles/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to delete agent profile");
    }
  };

  // Delete AdminProfile
  const deleteAdminProfile = async (id) => {
    try {
      await api.delete(`api/auth/admin-profiles/${id}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to delete admin profile");
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
  
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when updating the agent.";
      throw new Error(message); 
    }
  };

  // Update Context
  const updateContext = async (contextId, updatedData, isPartial = true) => {
    try {
      const method = isPartial ? "patch" : "put";
      console.log("updateContext: ", updatedData)
      const res = await api[method](`/api/contexts/${contextId}/`, updatedData);
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when updating the context.";
      console.log("error update context: ", error)
      throw new Error(message);
    }
  };

  // Update Space
  const updateSpace = async (spaceId, updatedData, isPartial = true) => {
    try {
      const method = isPartial ? "patch" : "put";
      const res = await api[method](`/api/spaces/${spaceId}/`, updatedData);
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when updating the Space.";
      throw new Error(message);
    }
  };

  // Update Relationship
  const updateRelationship = async (relationshipId, updatedData) => {
    try {
      const response = await api.patch(`/relationships/${relationshipId}/`, updatedData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when updating the relationship.";
      throw new Error(message);
    }
  };

  // Update a user by ID
 const updateUser = async (userId, payload) => {
    try {
      const response = await api.put(`api/auth/users/${userId}/`, payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to update user.";
      throw new Error(message);
    }
  };

  // Update AgentProfile by ID
  const updateAgentProfile = async (id, data) => {
    try {
      const res = await api.put(`api/auth/agent-profiles/${id}/`, data);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update agent profile");
    }
  };

  // Update AdminProfile by ID
  const updateAdminProfile = async (id, data) => {
    try {
      const res = await api.put(`api/auth/admin-profiles/${id}/`, data);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update admin profile");
    }
  };


  const getProfile = async () => {
    try {
      const res = await api.get(`api/auth/profile/`);
      console.log("Profile fetched successfully:", res.data);
      return res.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch agent profile");
    }
  }

  
  const updateProfile = async (updatedData) => {
    try {
      const res = await api.put(`api/auth/profile/`, updatedData);
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when updating the profile.";
      throw new Error(message);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const res = await api.post(`api/auth/change-password/`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.error || "Error occured when changing the password.";
      throw new Error(message);
    }
  };

   /* Archive and Unarchive Objects */
    const archive = async (model, id) => {
        try {
            const response = await api.post(`/api/${model}/${id}/archive/`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.error || `Error archiving ${model}`;
            throw new Error(message);
        }
    };

    const unarchive = async (model, id) => {
        try {
            const response = await api.post(`/api/${model}/${id}/unarchive/`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.error || `Error unarchiving ${model}`;
            throw new Error(message);
        }
    };

  return {
    getProfile,
    getAgents,
    getContexts,
    getSpaces,
    getUsers,
    getUser,
    getAgentProfiles,
    getAgentProfile,
    getAdminProfiles,
    getAdminProfile,
    getRelationships,
    createAgent,
    createAdmin,
    createContext,
    createSpace,
    createRelationship,
    deleteAgent,
    deleteContext,
    deleteSpace,
    deleteAgentProfile,
    deleteAdminProfile,
    deleteRelationship,
    updateAgent,
    updateContext,
    updateSpace,
    updateProfile,
    updateRelationship,
    changePassword,
    archive,
    unarchive,
  };
}