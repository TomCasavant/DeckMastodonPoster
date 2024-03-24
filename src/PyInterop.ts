import { ServerAPI, ServerResponse } from "decky-frontend-lib";

/**
 * Class for frontend - backend communication.
 */
export class PyInterop {
  private static serverAPI: ServerAPI;

  /**
   * Sets the interop's severAPI.
   * @param serv The ServerAPI for the interop to use.
   */
  static setServer(serv: ServerAPI): void {
    this.serverAPI = serv;
  }

  /**
   * Gets the interop's serverAPI.
   */
  static get server(): ServerAPI { return this.serverAPI; }

  /**
   * Logs a message to bash shortcut's log file and the frontend console.
   * @param message The message to log.
   */
  static async log(message: String): Promise<void> {
    console.log(message);
    await this.serverAPI.callPluginMethod<{ message: String }, boolean>("logMessage", { message: `[front-end]: ${message}` });
  }

  /**
   * Gets a user's home directory.
   * @returns A promise resolving to a server response containing the user's home directory.
   */
  static async getHomeDir(): Promise<ServerResponse<string>> {
    const res = await this.serverAPI.callPluginMethod<{}, string>("getHomeDir", {});
    return res;
  }

  /**
   * Shows a toast message.
   * @param title The title of the toast.
   * @param message The message of the toast.
   */
  static toast(title: string, message: string): void {
    return (() => {
      try {
        return this.serverAPI.toaster.toast({
          title: title,
          body: message,
          duration: 8000,
        });
      } catch (e) {
        console.log("Toaster Error", e);
      }
    })();
  }

  /**
   * Gets the value of a plugin's setting.
   * @param key The key of the setting to get.
   * @param defaultVal The default value of the setting.
   * @returns A promise resolving to the setting's value.
   */
  static async getSetting<T>(key: string, defaultVal: T): Promise<T> {
    return (await this.serverAPI.callPluginMethod<{ key: string, defaultVal: T }, T>("getSetting", { key: key, defaultVal: defaultVal })).result as T;
  }

  /**
   * Sets the value of a plugin's setting.
   * @param key The key of the setting to set.
   * @param newVal The new value for the setting.
   * @returns A void promise resolving once the setting is set.
   */
  static async setSetting<T>(key: string, newVal: T): Promise<ServerResponse<void>> {
    return await this.serverAPI.callPluginMethod<{ key: string, newVal : T}, void>("setSetting", { key: key, newVal: newVal });
  }

  static async post_status_with_media(text: string, media_ids: string[]): Promise<ServerResponse<void>> {
    this.toast("Posting Status", "Posting Status")
    return await this.serverAPI.callPluginMethod<{ text: string, media_ids: string[] }, void>("post_status_with_media", { text: text, media_ids: media_ids });
  }

  static async get_recent_photos(directory: string, count: number, offset: number): Promise<ServerResponse<string[]>> {
    const res = await this.serverAPI.callPluginMethod<{ directory: string, count: number, offset: number }, string[]>("get_recent_photos", { directory, count, offset });
    return res 
  }

  static async is_logged_in(): Promise<ServerResponse<boolean>> {
    const res = await this.serverAPI.callPluginMethod<{}, boolean>("is_logged_in", {})
    return res
  }

  static async get_auth_url(): Promise<ServerResponse<string>> {
    return await this.serverAPI.callPluginMethod<{}, string>('get_auth_url', {})
  }

  static async save_authentication(auth_code: string): Promise<ServerResponse<void>> {
    return await this.serverAPI.callPluginMethod<{auth_code: string}, void>("save_authentication", {auth_code});
  }
}