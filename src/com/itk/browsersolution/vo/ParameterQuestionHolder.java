/*
 * ParameterQuestionHolder.java
 */
package com.itk.browsersolution.vo;

import java.util.List;

/**
 * Class ParameterQuestionHolder
 * This class represents a group of parameter questions.
 *
 * @author Samuel Haddad
 * @since 26/09/2012
 * @version 2.4
 * 
 */
public class ParameterQuestionHolder {
    
    
    private String modsId;
    private List<ParameterQuestionVO> parametersQuestions;

    /**
     * Gets the mods identifier.
     * 
     * @return Returns the mods identifier.
     */    
    public String getModsId() {
        return modsId;
    }

    /**
     * Sets the mods identifier.
     * 
     * @param mods identifier.
     */        
    public void setModsId(String modsId) {
        this.modsId = modsId;
    }


    /**
     * Gets a list of parameter questions.
     * 
     * @return Returns a list of parameter questions.
     */        
    public List<ParameterQuestionVO> getParametersQuestions() {
        return parametersQuestions;
    }

    /**
     * Sets a list of parameter questions.
     * 
     * @param parametersQuestions List of parameter questions.
     */            
    public void setParametersQuestions(List<ParameterQuestionVO> parametersQuestions) {
        this.parametersQuestions = parametersQuestions;
    }

    /**
     * Replace each ocurrence of ParameterQuestionVO in the sourceData.
     * 
     * @param sourceData String to be replaced.
     * @return Returns String replaced.
     */
    public String replace(String sourceData)
    {
        if (parametersQuestions == null || parametersQuestions.isEmpty())
        {
            return sourceData;
        }
        for (ParameterQuestionVO question : parametersQuestions)
        {
            if (question != null && question.getParameterId() != null 
                    && question.getQuestionAnswer() != null)
            {
                sourceData = sourceData.replace(question.getParameterId(), question.getQuestionDescription());
            }
        }
        return sourceData;            
    }
    
    
}
