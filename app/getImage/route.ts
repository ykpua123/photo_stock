import { NextResponse } from "next/server";
import getResults from "@/pages/api/getResults.js";
import { count } from "console";

// export async function GET(request: Request) {

//     console.log(request, "GET")

//     const data = {
//         testing: ""
//     }
//     return NextResponse.json({data});
// }

type DataType = {
    search: string;
}

export async function POST(request: Request) {
    // console.log(await request.json(), "POST");
    try {
        const data: DataType = await request.json();
        const searchQuery = data.search;

        const response = await fetch(`http://photostock.idealtech.com.my/api/getResults?search=${encodeURIComponent(searchQuery)}&page=1&perPage=10`);
        const { results } = await response.json();

        console.log(data.search, "TESTING");

        if (!Array.isArray(results)) {
            console.error("Expected getResults to return an array, but got:", results);
            return NextResponse.json({ error: "Invalid response from getResults" }, { status: 500 });
        }
        const imagePaths = results.map((result: { imagePath: any; }) => result.imagePath).filter(Boolean);
        const count = imagePaths.length;

        return NextResponse.json({ images: imagePaths, count });

    } catch (error) {
        console.error("Error in POST request:", error);
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }
}