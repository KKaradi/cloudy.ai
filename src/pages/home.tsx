import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  Background,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import ImageNode from "../components/ImageNode";
import ModifyNode from '@/components/ModifyNode';
import StartNode from "../components/StartNode";


const rfStyle = {
};

const ySpacing = 500;
const xOffset = 800;

const addImageChildren = (
  parentId: string,
  batchSize: number,
  xPos:number,
  yPos:number,
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>
) => {
  let offset = 0;
  let modifiedIdList: string[] = [];
  setNodes((nodes: Node[]) => {
    offset = nodes.length;
    const nodesToAppend = Array.from({ length: batchSize }).map(function (
      _,
      index
    ) {
      const id = parentId+"."+index
      return {
        id,
        type: "image",
        position: {
          x: xPos + xOffset,
          y: index * ySpacing - (ySpacing * (batchSize - 1)) / 2 + yPos,
        },
        data: {
          setNodes,
          setEdges,
          imageSource: "/loading.gif",
          progres: 0,
          wakeUp: 0,
        },
      };
    });
    const newNodes = [...nodes, ...nodesToAppend];
    return newNodes as Node[];
  });

  setEdges((edges: Edge[]) => {
    const edgesToAppend = [];
    for (let index = 0; index < batchSize; index++) {
      edgesToAppend.push({
        id: `${parentId}-${index + offset}`,
        source: parentId,
        target: String(index + offset),
        sourceHandle: "a",
        targetHandle: "a",
      });
    }
    return [...edges, ...edgesToAppend] as Edge[];
  });
  return modifiedIdList;
};


const initialNodes: Node[] = [];

const initialEdges: Edge[] = [
  {
    id: "1-2",
    source: "2",
    target: "1",
    sourceHandle: "a",
    targetHandle: "a",
    animated: true,
    style:{
      stroke:'orange',
      strokeWidth:'10px',
    }
  },
];

const nodeTypes= { image: ImageNode, start: StartNode, modify: ModifyNode };

function Flow() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  useEffect(() => {
    setNodes([
      {
        id: "0",
        type: "start",
        position: { x: 300, y: 300 },
        data: {
          setNodes,
          setEdges
        },
      },
    ]);
  }, []);
  useEffect(()=>{},[nodes,setNodes]);


  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0}
        style={rfStyle}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default Flow;
