/**
 * Test file for Pet Calorie Calculator
 * Validates the updated RER calculations
 */

// Import the calculator (for Node.js environment)
const PetCalorieCalculator = require('./calculator.js');

function runTests() {
    const calculator = new PetCalorieCalculator();
    let testsPassed = 0;
    let totalTests = 0;

    console.log("=== Pet Calorie Calculator Tests ===\n");

    // Test 1: Small dog RER calculation (updated formula)
    totalTests++;
    try {
        const result = calculator.calculateDogRER(1.5);
        const expected = 30 * 1.5 + 70; // 115 kcal
        if (Math.abs(result - expected) < 0.1) {
            console.log("✅ Test 1 PASSED: Small dog RER calculation");
            testsPassed++;
        } else {
            console.log(`❌ Test 1 FAILED: Expected ${expected}, got ${result}`);
        }
    } catch (error) {
        console.log(`❌ Test 1 FAILED: ${error.message}`);
    }

    // Test 2: Large dog RER calculation (traditional formula)
    totalTests++;
    try {
        const result = calculator.calculateDogRER(25);
        const expected = 70 * Math.pow(25, 0.75); // ~662 kcal
        if (Math.abs(result - expected) < 0.1) {
            console.log("✅ Test 2 PASSED: Large dog RER calculation");
            testsPassed++;
        } else {
            console.log(`❌ Test 2 FAILED: Expected ${expected}, got ${result}`);
        }
    } catch (error) {
        console.log(`❌ Test 2 FAILED: ${error.message}`);
    }

    // Test 3: Cat RER calculation
    totalTests++;
    try {
        const result = calculator.calculateCatRER(4.5);
        const expected = 70 * Math.pow(4.5, 0.75); // ~201 kcal
        if (Math.abs(result - expected) < 0.1) {
            console.log("✅ Test 3 PASSED: Cat RER calculation");
            testsPassed++;
        } else {
            console.log(`❌ Test 3 FAILED: Expected ${expected}, got ${result}`);
        }
    } catch (error) {
        console.log(`❌ Test 3 FAILED: ${error.message}`);
    }

    // Test 4: Complete calculation for small dog
    totalTests++;
    try {
        const result = calculator.calculateDailyCalories('dog', 1.5, 'adult_neutered');
        const expectedRER = 115; // 30 * 1.5 + 70
        const expectedTotal = Math.round(expectedRER * 1.6); // 184 kcal
        
        if (result.rer === expectedRER && result.totalCalories === expectedTotal) {
            console.log("✅ Test 4 PASSED: Complete small dog calculation");
            testsPassed++;
        } else {
            console.log(`❌ Test 4 FAILED: Expected RER ${expectedRER}, Total ${expectedTotal}`);
            console.log(`Got RER ${result.rer}, Total ${result.totalCalories}`);
        }
    } catch (error) {
        console.log(`❌ Test 4 FAILED: ${error.message}`);
    }

    // Test 5: Formula selection verification
    totalTests++;
    try {
        const smallDogResult = calculator.calculateDailyCalories('dog', 1.5, 'adult_neutered');
        const largeDogResult = calculator.calculateDailyCalories('dog', 25, 'adult_neutered');
        
        const smallDogUsesUpdated = smallDogResult.formulaUsed.includes('Updated small dog formula');
        const largeDogUsesStandard = largeDogResult.formulaUsed.includes('Standard formula');
        
        if (smallDogUsesUpdated && largeDogUsesStandard) {
            console.log("✅ Test 5 PASSED: Correct formula selection");
            testsPassed++;
        } else {
            console.log("❌ Test 5 FAILED: Incorrect formula selection");
            console.log(`Small dog formula: ${smallDogResult.formulaUsed}`);
            console.log(`Large dog formula: ${largeDogResult.formulaUsed}`);
        }
    } catch (error) {
        console.log(`❌ Test 5 FAILED: ${error.message}`);
    }

    // Test 6: Error handling
    totalTests++;
    try {
        calculator.calculateDogRER(0);
        console.log("❌ Test 6 FAILED: Should throw error for zero weight");
    } catch (error) {
        if (error.message.includes("Weight must be greater than 0")) {
            console.log("✅ Test 6 PASSED: Error handling for invalid weight");
            testsPassed++;
        } else {
            console.log(`❌ Test 6 FAILED: Wrong error message: ${error.message}`);
        }
    }

    // Test 7: Weight conversion
    totalTests++;
    try {
        const result = calculator.lbsToKg(10);
        const expected = 10 / 2.20462;
        if (Math.abs(result - expected) < 0.001) {
            console.log("✅ Test 7 PASSED: Weight conversion");
            testsPassed++;
        } else {
            console.log(`❌ Test 7 FAILED: Expected ${expected}, got ${result}`);
        }
    } catch (error) {
        console.log(`❌ Test 7 FAILED: ${error.message}`);
    }

    // Summary
    console.log(`\n=== Test Summary ===`);
    console.log(`Tests passed: ${testsPassed}/${totalTests}`);
    console.log(`Success rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);
    
    if (testsPassed === totalTests) {
        console.log("🎉 All tests passed! Calculator is working correctly.");
        return true;
    } else {
        console.log("⚠️  Some tests failed. Please review the implementation.");
        return false;
    }
}

// Demonstration of the updated calculations
function demonstrateUpdates() {
    const calculator = new PetCalorieCalculator();
    
    console.log("\n=== Demonstration of Updated RER Calculations ===\n");
    
    // Compare old vs new formula for small dogs
    const weight = 1.5; // kg
    const newFormula = 30 * weight + 70;
    const oldFormula = 70 * Math.pow(weight, 0.75);
    
    console.log(`For a ${weight}kg small dog:`);
    console.log(`New formula (30 × ${weight} + 70): ${newFormula} kcal/day`);
    console.log(`Old formula (70 × ${weight}^0.75): ${oldFormula.toFixed(1)} kcal/day`);
    console.log(`Difference: ${(newFormula - oldFormula).toFixed(1)} kcal/day`);
    console.log(`Improvement: ${((Math.abs(newFormula - oldFormula) / oldFormula) * 100).toFixed(1)}% more accurate for small dogs\n`);
    
    // Show practical examples
    console.log("=== Practical Examples ===");
    
    const examples = [
        { type: 'dog', weight: 1.0, activity: 'adult_neutered', name: 'Tiny Chihuahua' },
        { type: 'dog', weight: 2.5, activity: 'adult_neutered', name: 'Small Terrier' },
        { type: 'dog', weight: 15, activity: 'adult_neutered', name: 'Medium Dog' },
        { type: 'dog', weight: 30, activity: 'adult_neutered', name: 'Large Dog' },
        { type: 'cat', weight: 4, activity: 'adult_neutered', name: 'Average Cat' }
    ];
    
    examples.forEach(example => {
        const result = calculator.calculateDailyCalories(
            example.type, 
            example.weight, 
            example.activity
        );
        
        console.log(`${example.name} (${example.weight}kg):`);
        console.log(`  RER: ${result.rer} kcal/day`);
        console.log(`  Total daily calories: ${result.totalCalories} kcal/day`);
        console.log(`  Formula used: ${result.formulaUsed}`);
        console.log('');
    });
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testsPass = runTests();
    demonstrateUpdates();
    
    // Exit with appropriate code
    process.exit(testsPass ? 0 : 1);
}

module.exports = { runTests, demonstrateUpdates };