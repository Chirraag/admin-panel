import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

// Upload category SVG file
export async function uploadCategorySvg(
  file: File,
  categoryId: string,
): Promise<string> {
  try {
    // Validate file type
    if (file.type !== "image/svg+xml") {
      throw new Error("Only SVG files are allowed for category icons");
    }

    const fileName = `category-${categoryId}-${Date.now()}.svg`;
    const storageRef = ref(storage, `categories/svgs/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading category SVG:", error);
    throw error;
  }
}

// Upload goal SVG image
export async function uploadGoalImage(
  file: File,
  categoryId: string,
  goalId: string,
): Promise<string> {
  try {
    // Validate file type (only SVG files allowed)
    if (file.type !== "image/svg+xml") {
      throw new Error("Only SVG files are allowed for goal images");
    }

    const fileName = `goal-${goalId}-${Date.now()}.svg`;
    const storageRef = ref(
      storage,
      `categories/${categoryId}/goals/${fileName}`,
    );

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading goal SVG:", error);
    throw error;
  }
}

// Upload sale type SVG image
export async function uploadSaleTypeImage(
  file: File,
  categoryId: string,
  saleTypeId: string,
): Promise<string> {
  try {
    // Validate file type (only SVG files allowed)
    if (file.type !== "image/svg+xml") {
      throw new Error("Only SVG files are allowed for sale type images");
    }

    const fileName = `saletype-${saleTypeId}-${Date.now()}.svg`;
    const storageRef = ref(
      storage,
      `categories/${categoryId}/sale-types/${fileName}`,
    );

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading sale type SVG:", error);
    throw error;
  }
}

// Delete image from Firebase Storage
export async function deleteStorageImage(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl) return;

    // Extract the path from the Firebase Storage URL
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    if (!imageUrl.startsWith(baseUrl)) {
      throw new Error("Invalid Firebase Storage URL");
    }

    // Parse the URL to get the storage path
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      throw new Error("Could not extract storage path from URL");
    }

    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    throw error;
  }
}
