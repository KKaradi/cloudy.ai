import Image from "next/image";
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Edge, Handle, Position } from "reactflow";
import styles from "@/styles/components/ImageNode.module.css";
type Props = {
  data: {
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    imageSource: string;
    processId: string;
    height: number;
    width: number;
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

import { Roboto } from "next/font/google";

const thin = Roboto({
  subsets: ["latin"],
  weight: "500",
});

const bold = Roboto({
  subsets: ["latin"],
  weight: "700",
});

const handleStyle: CSSProperties = {
  backgroundColor: "orange",
  borderRadius: "10px",
  width: "10.5px",
  height: "10px",
  borderWidth: "0px",
};

const addNodes = (
  xPos: number,
  yPos: number,
  parentId: string,
  setNodes: Dispatch<SetStateAction<Node[]>>,
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  imagePath: string,
  numChildren: number,
  setNumChildren: Dispatch<SetStateAction<number>>,
  width:number,
  height:number,
) => {
  let offset = 0;
  let modifiedIdList: string[] = [];
  setNodes((nodes: Node[]) => {
    offset = nodes.length;
    const newNodes = [
      ...nodes,
      {
        id: parentId + "." + numChildren,
        type: "modify",
        position: {
          x: xPos + width+100,
          y: yPos + (height+200) * numChildren,
        },
        data: {
          setNodes,
          setEdges,
          imagePath,
          width,
          height
        },
      },
    ];
    setNumChildren(numChildren + 1);
    return newNodes as Node[];
  });

  setEdges((edges: Edge[]) => {
    return [
      ...edges,
      {
        id: `${parentId}-${parentId + "." + numChildren}`,
        source: parentId,
        target: parentId + "." + numChildren,
        sourceHandle: "b",
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

export default function ImageNode(p: Props) {
  const [imageSrc, setImageSrc] = useState<string>(
    p.data.processId == "debug"
      ? "http://127.0.0.1:8188/view?filename=c_00001_.png&subfolder=cloudyv1%5Cimg&type=output"
      : "/loading.gif"
  );
  const [imagePath, setImagePath] = useState<string>(
    p.data.processId == "debug" ? "cloudyv1/img/c_00001_.png" : ""
  );
  const [progess, setProgress] = useState(0);
  const [done, setDone] = useState(p.data.processId == "debug" ? true : false);
  const [numChildren, setNumChildren] = useState(0);

  useEffect(() => {
    if (p.data.processId == "debug") return;
    const refreshIntervalId = setInterval(async () => {
      try {
        const response = await fetch("/api/process/" + p.data.processId);

        if (response.ok) {
          const responseData = await response.json();
          setProgress(responseData["progress"]);
          if (responseData["done"]) {
            clearInterval(refreshIntervalId);
            setImageSrc(
              responseData["batch"][0]["url"]
            );
            setImagePath(
              responseData["batch"][0]["path"]
            );
            setDone(true);
          }
          
        } else {
          console.error("Error:", response.statusText);
          clearInterval(refreshIntervalId);
        }
      } catch (error) {
        console.error("Error:", error);
        clearInterval(refreshIntervalId);
      }
    }, 3000);
  }, []);

  return (
    <div className="bg-white p-5 rounded-lg">
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        style={handleStyle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={handleStyle}
      />
      <div className={`text-xl ${bold.className}`}>Image:</div>
      <hr className={"bg-blue-600 h-1 border-none mt-1 mb-3 drop-shadow-md"} />
      <div style={{ width: p.data.width + "px", height: p.data.height + "px" }}>
        {done ? (
          <Image
            src={imageSrc}
            width={p.data.width}
            height={p.data.height}
            alt=""
            className="rounded-lg drop-shadow-xl"
          />
        ) : (
          <div className="flex h-full items-center justify-center flex-col">
            <div className={styles.wave}>
              <span className={styles.dot1}></span>
              <span className={styles.dot2}></span>
              <span className={styles.dot3}></span>
            </div>
            <div className="w-80 h-5 mt-10 rounded-xl bg-gray-400">
              <div
                className="w-80 h-5  rounded-xl bg-green-400"
                style={{ width: 320 * progess + "px" }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <div>
        {done ? (
          <div className="h-20 w-full py-2">
            <div
              className="
           p-2 bg-slate-200 rounded-lg  drop-shadow-md w-min"
            >
              <div
                className="bg-blue-400 p-2 px-10 rounded-lg hover:bg-sky-700 transition"
                onClick={() =>
                  addNodes(
                    p.xPos,
                    p.yPos,
                    p.id,
                    p.data.setNodes,
                    p.data.setEdges,
                    imagePath,
                    numChildren,
                    setNumChildren,
                    p.data.width,
                    p.data.height
                  )
                }
              >
                Modfiy
              </div>
            </div>
          </div>
        ) : (
          <div className="h-20 w-full py-2" />
        )}
      </div>
    </div>
  );
}
