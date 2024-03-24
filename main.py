import os
import sys

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`

sys.path.append(os.path.dirname(__file__))
import decky_plugin
from settings import SettingsManager
from pathlib import Path
from mastodon import Mastodon
import glob


class Plugin:

    pluginSettingsDir = os.environ["DECKY_PLUGIN_SETTINGS_DIR"]
    settingsManager = SettingsManager(name='mastodon-settings', settings_directory=pluginSettingsDir)
    client_cred_path = os.path.join(pluginSettingsDir, 'mastodon_clientcred.secret')
    user_cred_path = os.path.join(pluginSettingsDir, 'mastodon_usercred.secret')
    

    async def getSetting(self, key, defaultVal):
        return self.settingsManager.getSetting(key, defaultVal)

    async def setSetting(self, key, newVal):
        return self.settingsManager.setSetting(key, newVal)

    async def is_logged_in(self):
        decky_plugin.logger.info("Verifying login information")
        if not os.path.exists(self.client_cred_path) or not os.path.exists(self.user_cred_path):
            decky_plugin.logger.info("Unable to find paths")
            return False
        try:
            mastodon = Mastodon(access_token=self.user_cred_path)
            # Attempt to validate the credentials
            mastodon.account_verify_credentials()
            decky_plugin.logger.info("Successfully validated creds")
            return True
        except Exception as e:
            decky_plugin.logger.error(f"Error verifying login information: {e}")
            return False


    def login_to_mastodon(self, instance, email, password):
        decky_plugin.logger.info("Attempting to login")
        if not os.path.exists(self.client_cred_path):
            decky_plugin.logger.info("Path doesn't exist")
            decky_plugin.logger.info(Mastodon.create_app(
                'MastoDecky',
                api_base_url=f'https://{instance}',
                to_file=self.client_cred_path
            ))
            decky_plugin.logger.info("Registered App")
       
        mastodon = Mastodon(client_id=self.client_cred_path)
        decky_plugin.logger.info("Created client")
        mastodon.log_in(
            email,
            password,
            to_file=self.user_cred_path
        )
        return mastodon

    async def get_auth_url(self):
        instance = self.settingsManager.getSetting('instanceDomain', None)
        email = self.settingsManager.getSetting('mastodon_email', None)
        password = self.settingsManager.getSetting('mastodon_password', None)
        if not os.path.exists(self.client_cred_path):
            decky_plugin.logger.info("Path doesn't exist")
            Mastodon.create_app(
                'MastoDecky',
                api_base_url=f'https://{instance}',
                to_file=self.client_cred_path,
                redirect_uris=["urn:ietf:wg:oauth:2.0:oob"]
            )
            decky_plugin.logger.info("Registered App")

        mastodon = Mastodon(self.client_cred_path)
        redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'  # Use 'urn:ietf:wg:oauth:2.0:oob' for out-of-band authentication
        auth_url = mastodon.auth_request_url(redirect_uris=redirect_uri)
        return auth_url

    async def save_authentication(self, auth_code):
        try:
            mastodon = Mastodon(self.client_cred_path)
            redirect_uri="urn:ietf:wg:oauth:2.0:oob"
            mastodon.log_in(code=auth_code, to_file=self.user_cred_path)
        except Exception as e:
            decky_plugin.logger.info(f"Failed to save auth {e}")

    async def post_status_with_media(self, text, media_ids):
        """Posts a status with uploaded media"""
        decky_plugin.logger.info("Attempting to post status update")
        instance = self.settingsManager.getSetting('instanceDomain', None)
        email = self.settingsManager.getSetting('mastodon_email', None)
        password = self.settingsManager.getSetting('mastodon_password', None)
        mastodon = None
        #decky_plugin.logger.info(Mastodon(email, access_token=self.user_cred_path))
        decky_plugin.logger.info("Retrieved settings")
        #if not Mastodon(email, access_token=self.user_cred_path):
        #    decky_plugin.logger.info("User is not logged in!")
        #    mastodon = await self.login_to_mastodon(instance, email, password)
        #else:
        #    decky_plugin.logger.info("User is logged in, creating mastodon instance")
        #    mastodon = Mastodon(access_token = self.user_cred_path)
        if not os.path.exists(self.client_cred_path):
            decky_plugin.logger.info("Path doesn't exist")
            Mastodon.create_app(
                'MastoDecky',
                api_base_url=f'https://{instance}',
                to_file=self.client_cred_path,
                scopes=["read", "write"],
                redirect_uris=["urn:ietf:wg:oauth:2.0:oob"]
            )
            decky_plugin.logger.info("Registered App")
       
        mastodon = Mastodon(client_id=self.client_cred_path)
        decky_plugin.logger.info("Logged in!")
        try:
            mastodon.log_in(
                email,
                password,
                scopes=["read", "write"],
                redirect_uri="urn:ietf:wg:oauth:2.0:oob"
            )
        except Exception as e:
            decky_plugin.logger.info(f"{e}")

        uploaded_media_ids = []
        for media_path in media_ids:
            # Upload each media file
            decky_plugin.logger.info(media_path)
            #media_id = await self.upload_media(media_path)
            media_id = mastodon.media_post(media_path)
            decky_plugin.logger.info(media_id)
            uploaded_media_ids.append(media_id)

        #decky_plugin.logger.info("Uploaded!")

        # Post status with uploaded media IDs
        decky_plugin.logger.info(mastodon.status_post(text, media_ids=uploaded_media_ids))
        #decky_plugin.logger.info(f"Result: {res}")
        return "Status posted successfully"



    async def get_recent_photos(self, directory, count=10, offset=0):
        path = Path.home() / "Pictures" / "Screenshots" #os.path.join(directory, "**", "*.jpg")
        screenshot_files = list(path.glob("**/*.jpg"))
        screenshot_files.sort(key=os.path.getmtime, reverse=True)

        start_index = offset * count
        end_index = start_index + count

        recent_photos = screenshot_files[start_index:end_index]
        recent_photos_paths = [str(photo_path) for photo_path in recent_photos]

        return recent_photos_paths



    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def add(self, left, right):
        return left + right

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        decky_plugin.logger.info("Hello World!")

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        decky_plugin.logger.info("Goodbye World!")
        pass

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky_plugin.logger.info("Migrating")
        # Here's a migration example for logs:
        # - `~/.config/decky-template/template.log` will be migrated to `decky_plugin.DECKY_PLUGIN_LOG_DIR/template.log`
        decky_plugin.migrate_logs(os.path.join(decky_plugin.DECKY_USER_HOME,
                                               ".config", "decky-template", "template.log"))
        # Here's a migration example for settings:
        # - `~/homebrew/settings/template.json` is migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/template.json`
        # - `~/.config/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_SETTINGS_DIR/`
        decky_plugin.migrate_settings(
            os.path.join(decky_plugin.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".config", "decky-template"))
        # Here's a migration example for runtime data:
        # - `~/homebrew/template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        # - `~/.local/share/decky-template/` all files and directories under this root are migrated to `decky_plugin.DECKY_PLUGIN_RUNTIME_DIR/`
        decky_plugin.migrate_runtime(
            os.path.join(decky_plugin.DECKY_HOME, "template"),
            os.path.join(decky_plugin.DECKY_USER_HOME, ".local", "share", "decky-template"))
