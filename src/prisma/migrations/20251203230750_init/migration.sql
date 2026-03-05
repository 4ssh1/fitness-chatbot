-- CreateEnum
CREATE TYPE "Category" AS ENUM ('strength', 'cardio', 'flexibility', 'mobility', 'hiit');

-- CreateEnum
CREATE TYPE "TargetGender" AS ENUM ('male', 'female', 'both');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('protein', 'carbs', 'vegetables', 'fruits', 'snacks', 'beverages', 'swallow');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('common', 'seasonal', 'regional');

-- CreateEnum
CREATE TYPE "MealGoal" AS ENUM ('weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'strength');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateTable
CREATE TABLE "workouts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "targetGender" "TargetGender",
    "difficultyLevel" "DifficultyLevel" NOT NULL,
    "targetMuscles" TEXT[],
    "equipmentNeeded" TEXT[],
    "description" TEXT,
    "properForm" TEXT,
    "commonMistakes" TEXT,
    "setsRecommended" INTEGER,
    "repsRecommended" TEXT,
    "restTimeSeconds" INTEGER,
    "naijaContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_alternatives" (
    "id" SERIAL NOT NULL,
    "originalExerciseId" INTEGER NOT NULL,
    "alternativeExerciseId" INTEGER NOT NULL,
    "reason" TEXT,

    CONSTRAINT "exercise_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_guides" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "stanceDescription" TEXT,
    "gripDescription" TEXT,
    "movementPattern" TEXT,
    "breathingTechnique" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "safetyTips" TEXT[],
    "commonInjuriesToAvoid" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nigerian_foods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT,
    "category" "FoodCategory" NOT NULL,
    "caloriesPer100g" DECIMAL(6,2) NOT NULL,
    "proteinG" DECIMAL(5,2) NOT NULL,
    "carbsG" DECIMAL(5,2) NOT NULL,
    "fatsG" DECIMAL(5,2) NOT NULL,
    "fiberG" DECIMAL(5,2) NOT NULL,
    "isBudgetFriendly" BOOLEAN NOT NULL,
    "availability" "Availability" NOT NULL,
    "preparationTips" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nigerian_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_alternatives" (
    "id" SERIAL NOT NULL,
    "originalFoodId" INTEGER NOT NULL,
    "alternativeFoodId" INTEGER NOT NULL,
    "reason" TEXT,
    "notes" TEXT,

    CONSTRAINT "food_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "MealGoal" NOT NULL,
    "targetGender" "TargetGender" NOT NULL,
    "dailyCalories" INTEGER,
    "totalProteinG" DECIMAL(6,2),
    "totalCarbsG" DECIMAL(6,2),
    "totalFatsG" DECIMAL(6,2),
    "naijaContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" SERIAL NOT NULL,
    "mealPlanId" INTEGER NOT NULL,
    "mealType" "MealType" NOT NULL,
    "totalCalories" INTEGER,
    "totalProteinG" DECIMAL(6,2),
    "totalCarbsG" DECIMAL(6,2),
    "totalFatsG" DECIMAL(6,2),

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_items" (
    "id" SERIAL NOT NULL,
    "mealId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    "portion" TEXT NOT NULL,
    "calories" INTEGER,
    "proteinG" DECIMAL(5,2),
    "carbsG" DECIMAL(5,2),
    "fatsG" DECIMAL(5,2),

    CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_originalExerciseId_fkey" FOREIGN KEY ("originalExerciseId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_alternatives" ADD CONSTRAINT "exercise_alternatives_alternativeExerciseId_fkey" FOREIGN KEY ("alternativeExerciseId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_alternatives" ADD CONSTRAINT "food_alternatives_originalFoodId_fkey" FOREIGN KEY ("originalFoodId") REFERENCES "nigerian_foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_alternatives" ADD CONSTRAINT "food_alternatives_alternativeFoodId_fkey" FOREIGN KEY ("alternativeFoodId") REFERENCES "nigerian_foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "nigerian_foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
