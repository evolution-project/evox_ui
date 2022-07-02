import { TestBed } from '@angular/core/testing';

import { MuscleWidgetService } from './muscle-widget.service';

describe('MuscleWidgetService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MuscleWidgetService = TestBed.get(MuscleWidgetService);
    expect(service).toBeTruthy();
  });
});
