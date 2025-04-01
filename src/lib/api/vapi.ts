const VAPI_API_KEY = '219216e5-dc68-4894-9c52-275bb09ccfa6';
const VAPI_API_URL = 'https://api.vapi.ai';

interface VapiFile {
  id: string;
  name: string;
  orgId: string;
  url: string;
  bytes: string;
  object: string;
  purpose: string;
  createdAt: string;
  updatedAt: string;
  mimetype: string;
  bucket: string;
  path: string;
  status: string;
}

export async function uploadVapiFile(file: File): Promise<VapiFile> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${VAPI_API_URL}/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file to Vapi');
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading file to Vapi:', error);
    throw error;
  }
}

export async function deleteVapiFile(fileId: string): Promise<void> {
  try {
    const response = await fetch(`${VAPI_API_URL}/file/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete file from Vapi');
    }
  } catch (error) {
    console.error('Error deleting file from Vapi:', error);
    throw error;
  }
}