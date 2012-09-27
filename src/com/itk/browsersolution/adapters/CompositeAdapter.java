/*
 * CompositeAdapter.java
 */
package com.itk.browsersolution.adapters;

import com.itk.browsersolution.adapters.interfaces.IFileAdapter;
import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;
import java.util.LinkedList;
import java.util.List;

/**
 * Class CompositeAdapter
 * Creates an adapter´s pool to allow running a sequence of adapters.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4
 */
public class CompositeAdapter implements IJavaScriptAdapter{
    
    
    private List<IFileAdapter> pool = new LinkedList<IFileAdapter>();
    
    
    /**
     * Includes an adapter to run.
     * Running will be sequential.
     * 
     * @param adapter Adapter to be included for running.
     */
    public void add(IFileAdapter adapter)
    {
        pool.add(adapter);
    }
            

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        if (pool.isEmpty()){
            return false;
        }
        
        boolean modified = false;
        
        for (IFileAdapter adapter : pool)
        {
            boolean result = adapter.changeContent(file, parameterQuestionHolder);
            if (result)
            {
                modified = true;
            }
        }
        
        return modified;
    }
    
}
