import { Field, PanelSection, PanelSectionRow, quickAccessControlsClasses, TextField } from "decky-frontend-lib";
import { VFC, Fragment, useState, useEffect } from "react";
import { PyInterop } from "../../PyInterop";
import { useSetting } from "./utils/hooks/useSetting";


type SettingField = {
    title: string,
    shortTitle: string,
    settingsKey: string,
    default: string,
    description: string,
    validator: (newVal: string) => boolean,
    mustBeNumeric?: boolean
}

type SettingsFieldProps = {
    field: SettingField
}

const SettingsField: VFC<SettingsFieldProps> = ({ field }) => {
    const [ setting, setSetting ] = useSetting<string>(field.settingsKey, field.default);
    const [ fieldVal, setFieldVal ] = useState(setting);
  
    useEffect(() => {
      setFieldVal(setting);
    }, [setting]);
  
    const onChange = (e: any) => {
      const newVal = e.target.value;
      setFieldVal(newVal);
      
      PyInterop.log(`Checking newVal for ${field.settingsKey}. Result was: ${field.validator(newVal)} for value ${newVal}`);
      if (field.validator(newVal)) {
        setSetting(newVal).then(() => PyInterop.log(`Set value of setting ${field.settingsKey} to ${newVal}`));
      }
    }
  
    return (
      <TextField label={field.shortTitle} value={fieldVal} onChange={onChange} description={field.description} mustBeNumeric={field.mustBeNumeric} />
    );
  }
  
  export const Settings: VFC<{}> = ({}) => {
    const fields = [
      {
        title: "Instance Domain",
        shortTitle: "Instance",
        settingsKey: "instanceDomain",
        default: "mastodon.social",
        description: "This is where your user account is located. e.g. a user user@mastodon.social is located at the instance mastodon.social (Do not include 'https://www')",
        validator: (newVal: string) => newVal.length <= 65535,
        mustBeNumeric: false
      },
      {
        title: "Mastodon Email",
        shortTitle: "Username",
        settingsKey: "mastodon_email",
        default: "Bartholomew@tomiscool.com",
        description: "The email associated with your account",
        validator: (newVal: string) => newVal.length <= 65535,
        mustBeNumeric: false
      },
      {
        title: "Mastodon Passoword",
        shortTitle: "Password",
        settingsKey: "mastodon_password",
        default: "hunter2",
        description: "The password associated with your account",
        validator: (newVal: string) => newVal.length <= 65535,
        mustBeNumeric: false
      }
    ];
  
    return (
      <>
        <style>{`
            .bash-shortcuts-scoper .${quickAccessControlsClasses.PanelSection} {
              width: inherit;
              height: inherit;
              padding: 0px;
            }
          `}</style>
        <div className="bash-shortcuts-scoper">
          <PanelSection>
            {fields.map((field) => (
              <PanelSectionRow>
                <Field label={field.title} description={ <SettingsField field={field} /> } />
              </PanelSectionRow>
            ))}
          </PanelSection>
        </div>
      </>
    )
  }