import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RotateCcw } from 'lucide-react';

export const GraphVisualization = ({ objects = [], relationships = [] }) => {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredObjects, setFilteredObjects] = useState([]);
  const [filteredRelationships, setFilteredRelationships] = useState([]);

  // Filter data based on search and type filter
  useEffect(() => {
    if (!objects || objects.length === 0) {
      setFilteredObjects([]);
      setFilteredRelationships([]);
      return;
    }

    let filtered = [...objects];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(obj => obj.type === typeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(obj => 
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obj.category && obj.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredObjects(filtered);

    // Filter relationships to only include filtered objects
    const filteredObjectIds = new Set(filtered.map(obj => obj.id));
    const filteredRels = (relationships || []).filter(rel => 
      filteredObjectIds.has(rel.fromObjectId) && filteredObjectIds.has(rel.toObjectId)
    );
    setFilteredRelationships(filteredRels);
  }, [objects, relationships, searchTerm, typeFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setSelectedNode(null);
  };

  const focusOnObject = (objectId) => {
    const targetObject = objects.find(obj => obj.id === objectId);
    if (!targetObject) return;

    // Get all connected objects
    const connectedIds = new Set([objectId]);
    (relationships || []).forEach(rel => {
      if (rel.fromObjectId === objectId) connectedIds.add(rel.toObjectId);
      if (rel.toObjectId === objectId) connectedIds.add(rel.fromObjectId);
    });

    const connectedObjects = objects.filter(obj => connectedIds.has(obj.id));
    const connectedRelationships = (relationships || []).filter(rel => 
      connectedIds.has(rel.fromObjectId) && connectedIds.has(rel.toObjectId)
    );

    setFilteredObjects(connectedObjects);
    setFilteredRelationships(connectedRelationships);
    setSelectedNode(targetObject);
  };

  useEffect(() => {
    if (!filteredObjects || filteredObjects.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define color scale for different object types
    const colorScale = d3.scaleOrdinal()
      .domain(['agent', 'context', 'space'])
      .range(['#3b82f6', '#10b981', '#8b5cf6']);

    // Create nodes data
    const nodes = filteredObjects.map(obj => ({
      id: obj.id,
      name: obj.name || 'Unnamed',
      type: obj.type,
      category: obj.category,
      properties: obj.properties,
      x: Math.random() * (width - 2 * margin.left),
      y: Math.random() * (height - 2 * margin.top)
    }));

    // Create links data
    const links = filteredRelationships.map(rel => ({
      source: rel.fromObjectId,
      target: rel.toObjectId,
      relationshipType: rel.relationshipType || 'connected',
      id: rel.id
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(120)
        .strength(0.5))
      .force("charge", d3.forceManyBody()
        .strength(-400)
        .distanceMax(300))
      .force("center", d3.forceCenter((width - 2 * margin.left) / 2, (height - 2 * margin.top) / 2))
      .force("collision", d3.forceCollide()
        .radius(d => d.type === 'context' ? 35 : 30)
        .strength(0.7));

    // Create links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create link labels
    const linkLabel = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .text(d => d.relationshipType);

    // Create node groups
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles to nodes
    nodeGroup.append("circle")
      .attr("r", d => d.type === 'context' ? 20 : 16)
      .attr("fill", d => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("click", function(event, d) {
        setSelectedNode(d);
        // Highlight connected nodes
        const connectedNodeIds = new Set();
        links.forEach(link => {
          if (link.source.id === d.id) connectedNodeIds.add(link.target.id);
          if (link.target.id === d.id) connectedNodeIds.add(link.source.id);
        });
        
        // Update node styles
        nodeGroup.select("circle")
          .attr("stroke", node => {
            if (node.id === d.id) return "#ff0000";
            if (connectedNodeIds.has(node.id)) return "#ff9999";
            return "#fff";
          })
          .attr("stroke-width", node => {
            if (node.id === d.id) return 4;
            if (connectedNodeIds.has(node.id)) return 3;
            return 2;
          });

        // Update link styles
        link.attr("stroke", linkData => {
          if (linkData.source.id === d.id || linkData.target.id === d.id) return "#ff0000";
          return "#999";
        })
        .attr("stroke-width", linkData => {
          if (linkData.source.id === d.id || linkData.target.id === d.id) return 3;
          return 2;
        });
      });

    // Add labels to nodes
    nodeGroup.append("text")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.type === 'context' ? 35 : 30)
      .attr("fill", "#333")
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)
      .style("pointer-events", "none");

    // Add type badges
    nodeGroup.append("text")
      .attr("font-size", "8px")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.type === 'context' ? 45 : 40)
      .attr("fill", "#666")
      .text(d => d.type)
      .style("pointer-events", "none");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", `translate(${margin.left + event.transform.x},${margin.top + event.transform.y}) scale(${event.transform.k})`);
      });

    svg.call(zoom);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      linkLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

      nodeGroup
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };

  }, [filteredObjects, filteredRelationships]);

  if (!objects || objects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No data available to display in the graph.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="context">Contexts</SelectItem>
              <SelectItem value="space">Spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={resetFilters} size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Object Selection for Focus */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Focus on object:</span>
        <Select onValueChange={focusOnObject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select an object" />
          </SelectTrigger>
          <SelectContent>
            {objects.map(obj => (
              <SelectItem key={obj.id} value={obj.id}>
                {obj.name || 'Unnamed'} ({obj.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Agents</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Contexts</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Spaces</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Graph */}
        <div className="flex-1">
          <svg
            ref={svgRef}
            className="w-full border border-gray-200 rounded-lg bg-white"
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: selectedNode.type === 'agent' ? '#3b82f6' : 
                                   selectedNode.type === 'context' ? '#10b981' : '#8b5cf6' 
                  }}
                />
                <span>{selectedNode.name || 'Unnamed'}</span>
              </CardTitle>
              <CardDescription>
                <Badge>{selectedNode.type}</Badge>
                <Badge variant="outline" className="ml-2">{selectedNode.category || 'No category'}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Properties:</p>
                  <div className="mt-1 space-y-1">
                    {selectedNode.properties && Object.entries(selectedNode.properties).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Connections:</p>
                  <div className="mt-1 space-y-1">
                    {(relationships || [])
                      .filter(rel => rel.fromObjectId === selectedNode.id || rel.toObjectId === selectedNode.id)
                      .map(rel => {
                        const connectedId = rel.fromObjectId === selectedNode.id ? rel.toObjectId : rel.fromObjectId;
                        const connectedObject = objects.find(obj => obj.id === connectedId);
                        return (
                          <div key={rel.id} className="text-sm">
                            <span className="text-blue-600">{rel.relationshipType || 'connected'}</span> → {connectedObject?.name || 'Unknown'}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};