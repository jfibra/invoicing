import { NextRequest, NextResponse } from "next/server";
import { commissionsDb } from "@/lib/db";
import { ensureProjectsTable } from "@/lib/projects";
import { logSiteActivity } from "@/lib/activityLogger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET: Fetch list of projects (Supports search, developer_id, status, include_deleted)
export async function GET(request: NextRequest) {
  try {
    await ensureProjectsTable();
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get("developer_id");
    const status = searchParams.get("status");
    const includeDeleted = searchParams.get("include_deleted") === "true";
    const search = searchParams.get("search") || "";

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (!includeDeleted) {
      whereClause += " AND deleted_at IS NULL";
    }

    if (developerId) {
      whereClause += " AND developer_id = ?";
      queryParams.push(developerId);
    }

    if (status) {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    if (search) {
      whereClause += " AND (project_name LIKE ? OR developer_name LIKE ? OR project_location LIKE ? OR project_code LIKE ?)";
      const term = `%${search}%`;
      queryParams.push(term, term, term, term);
    }

    const [projects] = await commissionsDb.query<RowDataPacket[]>(
      `SELECT * FROM projects ${whereClause} ORDER BY developer_name ASC, project_name ASC`,
      queryParams
    );

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST: Create a new project
export async function POST(request: NextRequest) {
  try {
    await ensureProjectsTable();
    const body = await request.json();
    const {
      developer_id,
      developer_name,
      project_name,
      project_code,
      project_location,
      project_type,
      completion_status,
      status,
    } = body;

    if (!developer_id) {
      return NextResponse.json({ error: "Developer ID is required" }, { status: 400 });
    }

    if (!project_name || !project_name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    if (!project_location || !project_location.trim()) {
      return NextResponse.json({ error: "Project location is required" }, { status: 400 });
    }

    // Fetch Developer Name if not provided
    let devName = developer_name;
    if (!devName) {
      const [devRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT name FROM developers WHERE id = ?",
        [developer_id]
      );
      if (devRows.length === 0) {
        return NextResponse.json({ error: "Associated developer not found" }, { status: 404 });
      }
      devName = devRows[0].name;
    }

    const prjCode = project_code ? project_code.trim().toUpperCase() : `PRJ-${devName.trim().toUpperCase().slice(0, 4)}-${project_name.trim().toUpperCase().replace(/\s+/g, "")}`;
    const prjStatus = status === "inactive" ? "inactive" : "active";

    const [result] = await commissionsDb.query<ResultSetHeader>(
      `INSERT INTO projects 
       (developer_id, developer_name, project_name, project_code, project_location, project_type, completion_status, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        developer_id,
        devName,
        project_name.trim(),
        prjCode,
        project_location.trim(),
        project_type ? project_type.trim() : "Residential",
        completion_status ? completion_status.trim() : "Off-Plan",
        prjStatus,
      ]
    );

    const [created] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM projects WHERE id = ?",
      [result.insertId]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "CREATE_PROJECT",
      module_name: "SETTINGS",
      description: `Created project '${project_name.trim()}' for developer '${devName}'`,
      metadata: { project_id: result.insertId, developer_id, project_name: project_name.trim(), location: project_location.trim() },
    });

    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      project: created[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing project or restore a soft-deleted item
export async function PUT(request: NextRequest) {
  try {
    await ensureProjectsTable();
    const body = await request.json();
    const {
      id,
      developer_id,
      developer_name,
      project_name,
      project_code,
      project_location,
      project_type,
      completion_status,
      status,
      action,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Handle Restore Action
    if (action === "restore") {
      await commissionsDb.query("UPDATE projects SET deleted_at = NULL WHERE id = ?", [id]);
      await logSiteActivity({
        user_name: "System Admin",
        action_type: "RESTORE_PROJECT",
        module_name: "SETTINGS",
        description: `Restored project '${existing[0].project_name}' (#${id})`,
        metadata: { project_id: id, project_name: existing[0].project_name },
      });

      return NextResponse.json({
        success: true,
        message: "Project restored successfully",
      });
    }

    if (!project_name || !project_name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    if (!project_location || !project_location.trim()) {
      return NextResponse.json({ error: "Project location is required" }, { status: 400 });
    }

    // Fetch Developer Name if developer_id changed
    let devName = developer_name || existing[0].developer_name;
    let devId = developer_id || existing[0].developer_id;

    if (developer_id && developer_id !== existing[0].developer_id) {
      const [devRows] = await commissionsDb.query<RowDataPacket[]>(
        "SELECT name FROM developers WHERE id = ?",
        [developer_id]
      );
      if (devRows.length > 0) {
        devName = devRows[0].name;
      }
    }

    const prjCode = project_code ? project_code.trim().toUpperCase() : existing[0].project_code;
    const prjStatus = status === "inactive" ? "inactive" : "active";

    await commissionsDb.query(
      `UPDATE projects SET 
        developer_id = ?, 
        developer_name = ?, 
        project_name = ?, 
        project_code = ?, 
        project_location = ?, 
        project_type = ?, 
        completion_status = ?, 
        status = ? 
       WHERE id = ?`,
      [
        devId,
        devName,
        project_name.trim(),
        prjCode,
        project_location.trim(),
        project_type ? project_type.trim() : "Residential",
        completion_status ? completion_status.trim() : "Off-Plan",
        prjStatus,
        id,
      ]
    );

    const [updated] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "UPDATE_PROJECT",
      module_name: "SETTINGS",
      description: `Updated project '${project_name.trim()}' (#${id})`,
      metadata: { project_id: id, project_name: project_name.trim(), developer_name: devName },
    });

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a project (sets deleted_at = CURRENT_TIMESTAMP)
export async function DELETE(request: NextRequest) {
  try {
    await ensureProjectsTable();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const [existing] = await commissionsDb.query<RowDataPacket[]>(
      "SELECT id, project_name FROM projects WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await commissionsDb.query(
      "UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    await logSiteActivity({
      user_name: "System Admin",
      action_type: "DELETE_PROJECT",
      module_name: "SETTINGS",
      description: `Soft-deleted project '${existing[0].project_name}' (#${id})`,
      metadata: { project_id: id, project_name: existing[0].project_name },
    });

    return NextResponse.json({
      success: true,
      message: `Project '${existing[0].project_name}' soft deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
