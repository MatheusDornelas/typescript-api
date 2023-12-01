import { StormGlass } from "@src/clients/stormGlass";
import axios from "axios";
import stormGlassWeather3Hours from "@test/fixtures/stormglass_weather_3_hours.json";
import stormGlassNormalizedResponse3Hours from "@test/fixtures/stormglass_normalized_response_3_hours.json";

jest.mock("axios");

describe("StormGlass client", () => {
  const axiosMocked = axios as jest.Mocked<typeof axios>;
  it("should get a generic error from StormGlass service when the request fail before reaching the service", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    axiosMocked.get.mockResolvedValue({ data: stormGlassWeather3Hours });

    const stormGlass = new StormGlass(axios);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual(stormGlassNormalizedResponse3Hours);
  });

  it("should exclude incomplete data points", async () => {
    const lat = -33.792726;
    const lng = 151.289824;
    const incomplete_response = {
      hours: [
        {
          "swellDirection": {
            "noaa": 64.26
          }
        }
      ]
    }
    axiosMocked.get.mockResolvedValue({ data: incomplete_response });

    const stormGlass = new StormGlass(axios);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual([]);
  });

  it("exception 1", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    axiosMocked.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(axios);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Network Error'
    )
  });

  it("exception 2", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    class FakeAxiosError extends Error {
      constructor(public response: object) {
        super();
      }
    }

    axiosMocked.get.mockRejectedValue(
      new FakeAxiosError ({
        status: 429,
        data: { errors: ['Rate Limit reached'] },
      })
    );

    const stormGlass = new StormGlass(axios);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
    )
  });
});
