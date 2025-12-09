/**
 * Connectivity graph builder and utilities
 */

import type {
  AnyDevice,
  Connection,
  ConnectivityGraph,
  EditorLayout,
  GraphNode,
} from './types';

/**
 * Builds a connectivity graph from an editor layout
 */
export function buildConnectivityGraph(layout: EditorLayout): ConnectivityGraph {
  const nodes = new Map<string, GraphNode>();

  // Initialize nodes for all devices
  for (const device of layout.devices) {
    nodes.set(device.id, {
      deviceId: device.id,
      device,
      inputs: [],
      outputs: [],
    });
  }

  // Process connections
  for (const connection of layout.connections) {
    const fromNode = nodes.get(connection.fromDeviceId);
    const toNode = nodes.get(connection.toDeviceId);

    if (fromNode && toNode) {
      // Add output to source node
      if (!fromNode.outputs.includes(connection.toDeviceId)) {
        fromNode.outputs.push(connection.toDeviceId);
      }
      // Add input to target node
      if (!toNode.inputs.includes(connection.fromDeviceId)) {
        toNode.inputs.push(connection.fromDeviceId);
      }
    }
  }

  return {
    nodes,
    getNode(deviceId: string): GraphNode | undefined {
      return nodes.get(deviceId);
    },
    getConnectedOutputs(deviceId: string): string[] {
      return nodes.get(deviceId)?.outputs ?? [];
    },
    getConnectedInputs(deviceId: string): string[] {
      return nodes.get(deviceId)?.inputs ?? [];
    },
    getPath(fromDeviceId: string, toDeviceId: string): string[] | null {
      return findPath(nodes, fromDeviceId, toDeviceId);
    },
  };
}

/**
 * Finds a path between two devices using BFS
 */
export function findPath(
  nodes: Map<string, GraphNode>,
  fromDeviceId: string,
  toDeviceId: string
): string[] | null {
  if (fromDeviceId === toDeviceId) {
    return [fromDeviceId];
  }

  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; path: string[] }> = [];

  queue.push({ nodeId: fromDeviceId, path: [fromDeviceId] });
  visited.add(fromDeviceId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodes.get(current.nodeId);

    if (!currentNode) continue;

    for (const outputId of currentNode.outputs) {
      if (outputId === toDeviceId) {
        return [...current.path, toDeviceId];
      }

      if (!visited.has(outputId)) {
        visited.add(outputId);
        queue.push({
          nodeId: outputId,
          path: [...current.path, outputId],
        });
      }
    }
  }

  return null;
}

/**
 * Gets all reachable devices from a starting device
 */
export function getReachableDevices(
  graph: ConnectivityGraph,
  startDeviceId: string
): string[] {
  const visited = new Set<string>();
  const queue: string[] = [startDeviceId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const outputs = graph.getConnectedOutputs(currentId);
    for (const outputId of outputs) {
      if (!visited.has(outputId)) {
        queue.push(outputId);
      }
    }
  }

  // Remove the start device from results
  visited.delete(startDeviceId);
  return Array.from(visited);
}

/**
 * Gets all source devices (devices with no inputs)
 */
export function getSourceDevices(graph: ConnectivityGraph): AnyDevice[] {
  const sources: AnyDevice[] = [];
  
  for (const [, node] of graph.nodes) {
    if (node.inputs.length === 0 || node.device.type === 'source') {
      sources.push(node.device);
    }
  }

  return sources;
}

/**
 * Gets all sink devices (devices with no outputs)
 */
export function getSinkDevices(graph: ConnectivityGraph): AnyDevice[] {
  const sinks: AnyDevice[] = [];
  
  for (const [, node] of graph.nodes) {
    if (node.outputs.length === 0 || node.device.type === 'sink') {
      sinks.push(node.device);
    }
  }

  return sinks;
}

/**
 * Checks if the graph contains any cycles
 */
export function hasCycle(graph: ConnectivityGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outputs = graph.getConnectedOutputs(nodeId);
    for (const outputId of outputs) {
      if (!visited.has(outputId)) {
        if (dfs(outputId)) return true;
      } else if (recursionStack.has(outputId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const [nodeId] of graph.nodes) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}

/**
 * Performs topological sort on the graph
 * Returns null if the graph contains cycles
 */
export function topologicalSort(graph: ConnectivityGraph): string[] | null {
  const inDegree = new Map<string, number>();
  const result: string[] = [];
  const queue: string[] = [];

  // Initialize in-degrees
  for (const [nodeId] of graph.nodes) {
    const inputs = graph.getConnectedInputs(nodeId);
    inDegree.set(nodeId, inputs.length);
  }

  // Add nodes with no inputs to queue
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const outputs = graph.getConnectedOutputs(current);
    for (const outputId of outputs) {
      const newDegree = (inDegree.get(outputId) ?? 0) - 1;
      inDegree.set(outputId, newDegree);
      
      if (newDegree === 0) {
        queue.push(outputId);
      }
    }
  }

  // If we didn't process all nodes, there's a cycle
  if (result.length !== graph.nodes.size) {
    return null;
  }

  return result;
}
