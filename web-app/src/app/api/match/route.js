import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

// READ: Fetch all NoSQL student profiles or filter by skill keyword
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill");
    const db = await getMongoDb();

    const query = skill
      ? {
          $or: [
            { skills: { $regex: skill, $options: "i" } },
            { bio: { $regex: skill, $options: "i" } },
          ],
        }
      : {};

    const docs = await db
      .collection("student_resumes")
      .find(query, { projection: { _id: 0 } })
      .toArray();

    return NextResponse.json({ resumes: docs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// CREATE / UPDATE (Upsert): Store or update flexible JSON student profile in MongoDB
export async function PUT(request) {
  try {
    const { srn, name, dept, bio, skills, projects } = await request.json();
    const db = await getMongoDb();

    const skillArray = Array.isArray(skills)
      ? skills
      : String(skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    const projectArray = Array.isArray(projects)
      ? projects
      : String(projects || "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

    await db.collection("student_resumes").updateOne(
      { srn },
      {
        $set: {
          srn,
          name: name || srn,
          dept: dept || "CSE-AIML",
          bio: bio || "",
          skills: skillArray,
          projects: projectArray,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: `Saved MongoDB NoSQL profile for ${srn}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove a student's NoSQL document from MongoDB
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const srn = searchParams.get("srn");
    const db = await getMongoDb();
    await db.collection("student_resumes").deleteOne({ srn });
    return NextResponse.json({ message: `Deleted MongoDB document for ${srn}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}