import { supabase } from '@/integrations/supabase/client';
import { AgentConfig } from '@/types/agent';

export const testAgentIntegration = async () => {
  console.log('🔄 Testing Agent Backend Integration...');
  
  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(`Auth Error: ${authError.message}`);
    if (!user) throw new Error('User not authenticated');
    console.log('✅ User authenticated:', user.email);

    // Test 2: Test database write
    const testAgent = {
      user_id: user.id,
      name: 'Test Agent',
      type: 'chat' as 'chat' | 'assistant',
      intent: 'Testing backend integration',
      status: 'offline' as 'online' | 'offline' | 'processing',
      version: 'v1.0.0',
      last_modified: new Date().toISOString(),
      assistant_id: null,
      instructions: 'This is a test agent to verify backend integration.',
      model: 'gpt-4o',
      max_completion_tokens: 1000,
      top_p: 1.0,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('agents')
      .insert(testAgent)
      .select()
      .single();

    if (insertError) throw new Error(`Insert Error: ${insertError.message}`);
    console.log('✅ Agent saved to database:', insertData);

    // Test 3: Test database read
    const { data: readData, error: readError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (readError) throw new Error(`Read Error: ${readError.message}`);
    console.log('✅ Agent loaded from database:', readData);

    // Test 4: Test data transformation
    const agentConfig: AgentConfig = {
      id: readData.id,
      name: readData.name,
      type: readData.type as 'chat' | 'assistant',
      intent: readData.intent,
      status: readData.status as 'online' | 'offline' | 'processing',
      version: readData.version,
      createdAt: new Date(readData.created_at),
      lastModified: new Date(readData.last_modified),
      assistantId: readData.assistant_id || undefined,
      instructions: readData.instructions,
      modelSettings: {
        model: readData.model,
        maxCompletionTokens: readData.max_completion_tokens,
        topP: readData.top_p,
      },
    };
    console.log('✅ Data transformation successful:', agentConfig);

    // Test 5: Test database update
    const { error: updateError } = await supabase
      .from('agents')
      .update({ 
        name: 'Updated Test Agent',
        last_modified: new Date().toISOString() 
      })
      .eq('id', insertData.id);

    if (updateError) throw new Error(`Update Error: ${updateError.message}`);
    console.log('✅ Agent updated successfully');

    // Test 6: Clean up - delete test agent
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) throw new Error(`Delete Error: ${deleteError.message}`);
    console.log('✅ Test agent cleaned up');

    console.log('🎉 Backend Integration Test PASSED - All operations successful!');
    return {
      success: true,
      message: 'Backend integration is working perfectly!',
      details: {
        authentication: '✅ Working',
        databaseWrite: '✅ Working', 
        databaseRead: '✅ Working',
        dataTransformation: '✅ Working',
        databaseUpdate: '✅ Working',
        cleanup: '✅ Working'
      }
    };

  } catch (error) {
    console.error('❌ Backend Integration Test FAILED:', error);
    return {
      success: false,
      message: `Integration test failed: ${error.message}`,
      error: error
    };
  }
};

// Helper function to test RLS policies
export const testRLSPolicies = async () => {
  console.log('🔄 Testing RLS Policies...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Test: Try to access other users' agents (should return empty)
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .neq('user_id', user.id);

    if (error) {
      console.log('✅ RLS is working - access denied to other users data');
      return { success: true, message: 'RLS policies are working correctly' };
    }

    if (data && data.length === 0) {
      console.log('✅ RLS is working - no access to other users data');
      return { success: true, message: 'RLS policies are working correctly' };
    }

    console.warn('⚠️ RLS might not be working - got data from other users');
    return { success: false, message: 'RLS policies may need review' };

  } catch (error) {
    console.error('❌ RLS Test Error:', error);
    return { success: false, message: `RLS test failed: ${error.message}` };
  }
};