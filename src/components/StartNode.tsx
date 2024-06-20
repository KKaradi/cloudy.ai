import { CSSProperties, Dispatch, SetStateAction, useState } from "react";
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

const xOffset = 600;

const handleStyle: CSSProperties = {
  backgroundColor: "orange",
  borderRadius: "10px",
  width: "10.5px",
  height: "10px",
  borderWidth: "0px",
};

const toWidth = (isPortrait: boolean) => {
  return isPortrait ? 720 : 1080;
};

const toHeight = (isPortrait: boolean) => {
  return isPortrait ? 1080 : 720;
};

const addNodes = (
  xPos: number,
  yPos: number,
  parentId: string,
  processId: string,
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  numChildren: number,
  isPortrait: boolean
) => {
  let offset = 0;
  let modifiedIdList: string[] = [];
  setNodes((nodes: Node[]) => {
    offset = nodes.length;

    const newNodes = [
      ...nodes,
      {
        id:parentId + "." + numChildren,
        type: "image",
        position: {
          x: xPos + xOffset,
          y: numChildren * (toHeight(isPortrait) + 200) + yPos,
        },
        data: {
          setNodes,
          setEdges,
          imageSource: "/loading.gif",
          progres: 0,
          wakeUp: 0,
          processId,
          width: toWidth(isPortrait),
          height: toHeight(isPortrait),
        },
      },
    ];
    return newNodes as Node[];
  });

  setEdges((edges: Edge[]) => {
    console.log("new edges");

    return [
      ...edges,
      {
        id: `${parentId}-${parentId + "." + numChildren}`,
        source: parentId,
        target: parentId + "." + numChildren,
        sourceHandle: "a",
        targetHandle: "b",
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

export default function InputNode(p: Props) {
  const { data, xPos, yPos, id } = p;
  const [positiveClip, setPositiveClip] = useState<string>("");
  const [negativeClip, setNegativeClip] = useState<string>();
  const [seed, setSeed] = useState<string>(
    String(Math.floor(Math.random() * 10e15))
  );
  const [denoise, setDenoise] = useState<string>("1.00");
  const [steps, setSteps] = useState<string>("15");
  const [isPortrait, setIsPortrait] = useState<boolean>(true);
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
    const childrenIds = addNodes(
      xPos,
      yPos,
      id,
      uuid,
      data.setNodes,
      data.setEdges,
      numChildren,
      isPortrait
    );
    setNumChildren(numChildren + 1);
    setSeed(String(Math.floor(Math.random() * 10e15)));
    try {
      const response = await fetch("/api/comfyStart", {
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
          width: toWidth(isPortrait),
          height: toHeight(isPortrait),
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
      } else {
        console.error("Error:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg">
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        id="a"
      />
      <div className={`text-xl ${bold.className}`}>Begin:</div>
      <hr className={"bg-yellow-500 h-1 border-none mt-1 drop-shadow-md"} />
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
          {/* <div
            className="my-2 
           p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div className=" bg-white rounded-lg p-2 flex">
              <div className="p-1 w-20 ">Batch:</div>
              <input
                id="batchsize"
                name="text"
                onChange={onChangeBatch}
                value={batch}
                className="w-full rounded nodrag p-1 border-2 border-grey"
              />
            </div>
          </div> */}
          <div
            className="my-2 
           p-2 bg-slate-200 rounded-lg  drop-shadow-md"
          >
            <div className=" bg-white rounded-lg p-2 flex ">
              {isPortrait ? (
                <div
                  className={
                    "bg-green-400 p-2 mr-5 text-center w-1/2 px-10 rounded-lg border-2 transition "
                  }
                  onClick={() => setIsPortrait(true)}
                >
                  Portrait
                </div>
              ) : (
                <div
                  className={
                    "bg-white p-2 mr-5 text-center w-1/2 px-10 rounded-lg border-2 transition hover:bg-gray-200"
                  }
                  onClick={() => setIsPortrait(true)}
                >
                  Portrait
                </div>
              )}
              {isPortrait ? (
                <div
                  className={
                    "bg-white p-2 text-center w-1/2 px-10 rounded-lg border-2 transition hover:bg-gray-200"
                  }
                  onClick={() => setIsPortrait(false)}
                >
                  Landscape
                </div>
              ) : (
                <div
                  className={
                    "bg-green-400 p-2 text-center w-1/2 px-10 rounded-lg border-2 transition "
                  }
                  onClick={() => setIsPortrait(false)}
                >
                  Landscape
                </div>
              )}
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
