import axios from "axios";

export const updateShowboardConfig = async (
  imagesPerTheme: number,
  model: string,
  textModel: string
) => {
  try {
    const response = await axios.post(
      "https://platform-backend-api-dev-547175224231.us-central1.run.app/update-showboard-config",
      {
        no_of_images_per_theme: imagesPerTheme,
        model: model,
        text_model: textModel,
      }
    );

    console.log("Showboard config updated:", response.data);
  } catch (error) {
    console.error("Error updating showboard config:", error);
  }
};

export const getShowboardConfig = async () => {
  try {
    const response = await axios.get(
      "https://platform-backend-api-dev-547175224231.us-central1.run.app/get-showboard-config"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching showboard config:", error);
    throw error; // optional: rethrow if you want caller to handle it
  }
};
