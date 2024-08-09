import * as assert from 'assert';
import * as vscode from 'vscode';
import { validatePrompts, Prompt, fetchPrompts } from '../utils/prompts'; // Added fetchPrompts to the import

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('validatePrompts should return missing required prompts', () => {
        // Mock the PROMPTS array to have some required prompts missing
        const mockPrompts: Prompt[] = [
            { id: "1", role: "system", content: "", category: "lead-architect", models: "", active: false, tag: "" },
            { id: "2", role: "system", content: "", category: "developer", models: "", active: true, tag: "" }
        ];

        // Temporarily replace the PROMPTS array
        const originalPrompts = (global as any).PROMPTS;
        (global as any).PROMPTS = mockPrompts;

        const missingPrompts = validatePrompts();

        // Restore the original PROMPTS array
        (global as any).PROMPTS = originalPrompts;

        // We expect the missing required prompts to be returned
        assert.strictEqual(missingPrompts.length, 1);
        assert.strictEqual(missingPrompts[0].category, "lead-engineer");
    });

    // New test for fetchPrompts function
    test('fetchPrompts should return correct prompts based on role, category, and model', () => {
        // Mock the PROMPTS array
        const mockPrompts: Prompt[] = [
            { id: "1", role: "system", content: "Content 1", category: "lead-architect", models: "model1,model2", active: true, tag: "tag1" },
            { id: "2", role: "user", content: "Content 2", category: "developer", models: "model1", active: true, tag: "tag2" },
            { id: "3", role: "system", content: "Content 3", category: "lead-engineer", models: "model2", active: true, tag: "tag3" },
            { id: "4", role: "system", content: "Content 4", category: "lead-architect", models: "model1", active: false, tag: "tag4" },
        ];

        // Temporarily replace the PROMPTS array
        const originalPrompts = (global as any).PROMPTS;
        (global as any).PROMPTS = mockPrompts;

        // Test case 1: Should return one prompt
        let result = fetchPrompts("system", "lead-architect", "model1");
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, "1");

        // Test case 2: Should return no prompts (inactive prompt)
        result = fetchPrompts("system", "lead-architect", "model1");
        assert.strictEqual(result.length, 1);

        // Test case 3: Should return no prompts (non-matching model)
        result = fetchPrompts("system", "lead-engineer", "model1");
        assert.strictEqual(result.length, 0);

        // Restore the original PROMPTS array
        (global as any).PROMPTS = originalPrompts;
    });
});