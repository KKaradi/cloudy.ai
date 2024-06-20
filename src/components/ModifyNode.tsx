import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { Node, Edge, Handle, Position } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { Roboto } from "next/font/google";

const thin = Roboto({
  subsets: ["latin"],
  weight: "500",
});

const bold = Roboto({
  subsets: ["latin"],
  weight: "700",
});

type Props = {
  data: {
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    imagePath: string;
    width: number;
    height: number;
  };
  dragHandle: undefined;
  dragging: boolean;
  id: string;
  isConnectable: boolean;
  selected: boolean;
  sourcePosition: string;
  targetPosition: string;
  type: string;
  xPos: number;
  yPos: number;
  zIndex: number;
};

const handleStyle: CSSProperties = {
  backgroundColor: "orange",
  borderRadius: "10px",
  width: "10.5px",
  height: "10px",
  borderWidth: "0px",
};

const xOffset = 600;

const addNodes = (
  xPos: number,
  yPos: number,
  parentId: string,
  processId: string,
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  width: number,
  height: number,
  numChildren: number
) => {
  let offset = 0;
  let modifiedIdList: string[] = [];
  setNodes((nodes: Node[]) => {
    offset = nodes.length;
    console.log(xPos);
    console.log(offset);
    const newNodes = [
      ...nodes,
      {
        id: parentId + "." + numChildren,
        type: "image",
        position: {
          x: xPos + xOffset,
          y: numChildren * (height + 200) + yPos,
        },
        data: {
          setNodes,
          setEdges,
          imageSource: "/loading.gif",
          progres: 0,
          wakeUp: 0,
          processId,
          width,
          height,
        },
      },
    ];
    console.log(newNodes);
    // const finList = [...nodes];
    console.log(newNodes.length);

    return newNodes as Node[];
  });

  setEdges((edges: Edge[]) => {
    console.log("new edges");

    console.log(edges);
    return [
      ...edges,
      {
        id: `${parentId}-${parentId + "." + numChildren}`,
        source: parentId,
        target: parentId + "." + numChildren,
        sourceHandle: "a",
        targetHandle: "a",
        animated: true,
        style: {
          stroke: "orange",
          strokeWidth: "2px",
        },
        arrowHeadType: "arrow",
      },
    ] as Edge[];
  });
  return modifiedIdList;
};

export default function ModifyNode(p: Props) {
  const { data, xPos, yPos, id } = p;
  const [positiveClip, setPositiveClip] = useState<string>("");
  const [negativeClip, setNegativeClip] = useState<string>();
  const [seed, setSeed] = useState<string>(
    String(Math.floor(Math.random() * 10e15))
  );
  const [denoise, setDenoise] = useState<string>(".80");
  const [steps, setSteps] = useState<string>("10");
  const [numChildren, setNumChildren] = useState(0);
  const onChangePositiveClip = (e: any) => {
    setPositiveClip(e.target.value);
  };

  const onChangeNegativeClip = (e: any) => {
    setNegativeClip(e.target.value);
  };

  const onChangeSeed = (e: any) => {
    const regex = new RegExp("^[0-9\b]*$");
    if (regex.test(e.target.value)) {
      setSeed(e.target.value);
    }
  };

  const onChangeDenoise = (e: any) => {
    const regex = new RegExp("^[0-9.\b]*$");
    if (regex.test(e.target.value)) {
      setDenoise(e.target.value);
    }
  };

  const onChangeSteps = (e: any) => {
    const regex = new RegExp("^[0-9\b]*$");
    if (regex.test(e.target.value)) {
      setSteps(e.target.value);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const uuid = uuidv4();
    addNodes(
      xPos,
      yPos,
      id,
      uuid,
      data.setNodes,
      data.setEdges,
      data.width,
      data.height,
      numChildren
    );
    setNumChildren(numChildren + 1);
    setSeed(String(Math.floor(Math.random() * 10e15)));
    try {
      const response = await fetch("api/comfyModify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positiveClip,
          negativeClip,
          steps: Number(steps),
          denoise: Number(denoise),
          seed: Number(seed),
          uuid,
          imagePath: p.data.imagePath,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // updateImages(childrenIds, responseData, data.setNodes);

        // Handle the response data as needed
      } else {
        console.error("Error:", response.statusText);
        // Handle errors
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };


  return (
    <div className="bg-white p-5 rounded-xl shadow-lg">
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
        id="a"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        id="b"
      />
      <div className={`text-xl ${bold.className}`}>Modiy:</div>
      <hr className={"bg-purple-600 h-1 border-none mt-1 drop-shadow-md"} />
      <div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div
            className="mt-3
         p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div
              className={`w-100% bg-white text-green-500 rounded-lg p-2 ${thin.className}`}
            >
              Positive Prompt:
            </div>
            <textarea
              id="positive-clip"
              name="text"
              onChange={onChangePositiveClip}
              value={positiveClip}
              rows={4}
              cols={60}
              className="rounded-lg nodrag align-bottom resize-none p-2 mt-2"
            />
          </div>
          <div
            className="mt-3
         p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div
              className={`w-100% bg-white text-red-500 rounded-lg p-2 ${thin.className}`}
            >
              Negative Prompt:
            </div>
            <textarea
              id="negative-clip"
              name="text"
              onChange={onChangeNegativeClip}
              value={negativeClip}
              rows={4}
              cols={60}
              className="rounded-lg nodrag align-bottom resize-none p-2 mt-2"
            />
          </div>
          <div
            className="my-2 
         p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div className=" bg-white rounded-lg p-2 flex">
              <div className="p-1 w-20">Seed:</div>

              <input
                id="seed"
                name="text"
                onChange={onChangeSeed}
                value={seed}
                placeholder="Enter a number"
                className="w-full rounded nodrag p-1 border-2 border-grey"
              />
            </div>
          </div>
          <div
            className="my-2 
         p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div className=" bg-white rounded-lg p-2 flex">
              <div className="p-1 w-20">Step:</div>
              <input
                id="seed"
                name="text"
                onChange={onChangeSteps}
                value={steps}
                className="w-full rounded nodrag p-1 border-2 border-grey"
              />
            </div>
          </div>

          <div
            className="my-2 
         p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div className=" bg-white rounded-lg p-2 flex">
              <div className="p-1 w-20">Denoise:</div>
              <input
                id="seed"
                name="text"
                onChange={onChangeDenoise}
                value={denoise}
                className="w-full rounded nodrag p-1 border-2 border-grey"
              />
            </div>
          </div>

          <div
            className="mt-3 
         p-2 bg-slate-200 rounded-lg  drop-shadow-md w-min"
          >
            <button
              type="submit"
              className="bg-blue-400 p-2 px-10 rounded-lg hover:bg-sky-700 transition"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
