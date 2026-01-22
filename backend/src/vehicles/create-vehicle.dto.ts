import { IsString, IsInt, IsNumber, IsDateString, IsOptional, Min, Max, Matches, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDate implements ValidatorConstraintInterface {
  validate(date: string, args: ValidationArguments) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return inputDate <= today;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La date de première mise en circulation ne peut pas être postérieure à la date du jour';
  }
}

@ValidatorConstraint({ name: 'newValueGreaterThanMarketValue', async: false })
export class NewValueGreaterThanMarketValue implements ValidatorConstraintInterface {
  validate(newValue: number, args: ValidationArguments) {
    const object = args.object as any;
    return newValue >= object.marketValue;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La valeur à neuf doit être supérieure ou égale à la valeur vénale';
  }
}

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() ? value.toUpperCase() : undefined)
  @Matches(/^[A-Z0-9-]+$/i, { message: 'Invalid registration format' })
  registration?: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  fiscalHorsepower: number;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(2)
  @Max(50)
  numberOfSeats: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Validate(NewValueGreaterThanMarketValue)
  newValue: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  marketValue: number;

  @IsDateString()
  @Validate(IsNotFutureDate)
  firstCirculationDate: string;
}
