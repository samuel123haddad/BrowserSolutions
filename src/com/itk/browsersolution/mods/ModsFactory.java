/*
 * ModsFactory.java
 */
package com.itk.browsersolution.mods;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Class ModsFactory 
 * Creates a factory to mods according with mod type.
 *
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/2012
 * @version 2.4
 */
public class ModsFactory {

    private Map<String, BaseMods> mods = new HashMap<String, BaseMods>();
    
    
    /**
     * Constructor
     * 
     */
    public ModsFactory()
    {
       BaseMods mods1 = new com.itk.browsersolution.mods.last4digitvalidation.ModLast4DigitLoginValidation(); 
       mods.put(mods1.getId(), mods1);
    }

    /**
     * Gets mods related to target version. 
     * 
     * @param targetVersion Target version to validate mods support.
     * @param modId Mods identifier.
     * @return 
     */
    public BaseMods getInstance(String targetVersion, String modId) {

        if (targetVersion == null || targetVersion.trim().length() == 0) {
            return null;
        } 
        
        BaseMods composite = mods.get(modId);
        if (composite != null)
        {
            if (composite.getSupportedVersions().contains(targetVersion))
            {
                return composite;
            }
        }
        return null;
    }
    
    /**
     * Gets the list of mods with identifier and description.
     * 
     * @return Returns the list of mods with identifier and description.
     */
    public List<String> getDescriptions()
    {
        List<String> descriptions = new LinkedList<String>();
        for (String modId : mods.keySet())
        {
            BaseMods composite = (BaseMods) mods.get(modId);
            String modDescription = modId + " - " + ( composite != null ? composite.getDescription() : "");
            descriptions.add(modDescription);
        }
        
        return descriptions;
    }
}
