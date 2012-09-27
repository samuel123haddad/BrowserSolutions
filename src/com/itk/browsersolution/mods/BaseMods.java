/*
 BaseMods.java
 */
package com.itk.browsersolution.mods;

import com.itk.browsersolution.adapters.CompositeAdapter;
import com.itk.browsersolution.vo.ParameterQuestionVO;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Class BaseMods
 * Base Class to implements Mods.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public abstract class BaseMods extends CompositeAdapter{
    
    Map<String, ParameterQuestionVO> parametersQuestions = new HashMap<String, ParameterQuestionVO>();
    
    /**
     * Gets the Mods description.
     * 
     * @return Returns Mods description.
     */
    public abstract String getDescription();
    
    /**
     * Gets the Mods identifier.
     * 
     * @return Returns Mods identifier.
     */
    public abstract String getId();

    
    /**
     * Gets the Mods parameters questions.
     * For each parameter defined in the mods adapters, a question must be 
     * made and the related answer must be stored to be replaced while running 
     * the mods adapter.
     * 
     * @return Returns Mods parameters questions.
     */
    public Map<String,ParameterQuestionVO> getParameterQuestions()
    {
        return parametersQuestions;
    }
    
    
    /**
     * Gets the Mods supported versions of Lawson.
     * 
     * @return Returns Mods supported versions of Lawson.
     */
    public List<String> getSupportedVersions()
    {
        
        return new LinkedList<String>(Arrays.asList(new String[]{"9.0.1.7", "9.0.1.8", "9.0.1.9", "9.0.1.10"}));
    }
    
    
}
