// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";



type RequestParams = {
  positiveClip?: string;
  negativeClip?: string;
  steps?: number;
  denoise?: number;
  seed?: number;
  batch?: number;
  uuid: string;
  width:number;
  height:number;
};

async function initCloudyParams(params: RequestParams) {
  const cloudyParamsFile = await fs.readFile(
    "./utils/start-cloudy-api.json",
    "utf-8"
  );
  const cloudyParams = JSON.parse(cloudyParamsFile);
  cloudyParams["6"]["inputs"]["text"] = cloudyParams["6"]["inputs"][
    "text"
  ].replaceAll("<insert>", params["positiveClip"] ?? "");
  cloudyParams["7"]["inputs"]["text"] = cloudyParams["7"]["inputs"][
    "text"
  ].replaceAll("<insert>", params["negativeClip"] ?? "");
  cloudyParams["3"]["inputs"]["denoise"] = params["denoise"] ?? 1;
  cloudyParams["3"]["inputs"]["seed"] =
    params["seed"] ?? Math.floor(Math.random() * 100);
  cloudyParams["3"]["inputs"]["steps"] = params["steps"] ?? 12;
  cloudyParams["5"]["inputs"]["width"] = params["width"] ?? 720;
  cloudyParams["5"]["inputs"]["height"] = params["height"] ?? 1080;
  return cloudyParams;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  console.log("Request made to comfy");
  if (req.method === "POST") {
    try {
      const params: RequestParams = req.body;
      const cloudyParams = await initCloudyParams(params);

      const apiUrl = `${process.env.FLASK_PORT}/start`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({params:cloudyParams,uuid:params['uuid']}),
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
