"use server";
import { env } from "@/config/env";
import { google } from "googleapis";

// The Google Sheet ID
const SHEET_ID = "17acbkD6jH-oK3neUaOSaQ5Xjn_zkHa2HO8Z6GuABspg";
const SHEET_NAME = "ErrorLogs";

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    client_email: env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    private_key: env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function logError(
  userId: string,
  userEmail: string,
  environment: string,
  errorMessage: string
) {
  try {
    const sheets = google.sheets({ version: "v4", auth });

    // Get the current rows to check if header exists
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:A1`,
    });

    // Add header if empty
    if (!getRes.data.values || getRes.data.values.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "Timestamp",
              "User ID",
              "User Email",
              "Environment",
              "Error Message",
            ],
          ],
        },
      });
    }
    console.log(errorMessage);
    // Append the error row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            new Date().toDateString(),
            userId,
            userEmail,
            environment,
            errorMessage,
          ],
        ],
      },
    });

    console.log("Error logged to Google Sheet successfully!");
  } catch (err) {
    console.error("Failed to log error to Google Sheet:", err);
  }
}
